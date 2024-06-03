let transcriptionInProgress = false;
let outputDisplayed = false;
let audio_uploaded = false;
let invalidFileShown = false; // Add a new flag to track the invalid file alert

// Progress-bar
let circularProgress = document.querySelector(".circular-progress"),
    progressValue = document.querySelector(".progress-value");

let progressEndValue = 98;
let progressStartValue = 0;

// Function to handle file selection
function handleFileSelect(event) {
    event.preventDefault();

    if (audio_uploaded) {
        alert("Click on Select Another Audio");
        return;
    }

    if (transcriptionInProgress) {
        alert("Transcription is in progress. Please wait until it completes.");
        return;
    }

    if (outputDisplayed) {
        alert("Click on 'Try Another Audio'");
        return;
    }

    const fileInput = document.getElementById('audioFileInput');
    const files = event.target.files || event.dataTransfer.files;
    const file = files[0];
    fileInput.files = files;

    if (!file) {
        alert('Please select an audio file.');
        return;
    }

    const allowedExtensions = ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'aac'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtension = allowedExtensions.includes(fileExtension);
    const validMimeType = file.type.startsWith('audio/');

    if (!validExtension || !validMimeType) {
        alert('Invalid file type. Please upload a valid audio file.');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please select a smaller audio file.');

        // Remove the event listener to prevent re-triggering
        fileInput.removeEventListener('change', handleFileSelect);

        fileInput.value = ''; // Clear input value

        // Add the event listener back after clearing the value
        setTimeout(() => {
            fileInput.addEventListener('change', handleFileSelect);
        }, 0);

        return;
    }

    // Create an audio element to check the duration
    const audioElement = document.createElement('audio');
    audioElement.src = URL.createObjectURL(file);

    // Wait for the metadata to load to get the duration
    audioElement.onloadedmetadata = function () {
        if (audioElement.duration <= 0) {
            alert('Invalid audio file. The duration is 0 seconds.');
            return;
        }

        // Reset the invalid file alert flag
        invalidFileShown = false;

        // Remove any existing audio element
        const existingAudio = document.querySelector('audio');
        if (existingAudio) {
            existingAudio.remove();
        }

        // Append the new audio element
        audioElement.controls = true;
        const audioContainer = document.querySelector('.text-container-main');
        audioContainer.appendChild(audioElement);

        const formData = new FormData();
        formData.append('audio', file);
        audio_uploaded = true;

        const transcribeBtn = document.getElementById('transcribeBtn');
        const fileUploadSection = document.getElementById('fileUploadSection');
        const fileInfoSection = document.getElementById('fileInfoSection');
        const anotheraudio = document.getElementById('anotheraudio');

        fileUploadSection.style.display = 'none';
        fileInfoSection.style.display = 'block';

        document.getElementById('audioFileName').textContent = file.name;
        document.getElementById('audioFileSize').textContent = (file.size / 1024).toFixed(2) + ' KB';

        transcribeBtn.style.display = 'block';
        anotheraudio.style.display = 'block';
    };

    audioElement.onerror = function () {
        if (!invalidFileShown) {
            alert('Invalid audio file.');
            invalidFileShown = true; // Set the flag to true to prevent duplicate alerts
            fileInput.value = ''; // Clear input value
        }
    };
}

function transcribe() {
    var formData = new FormData();

    if (transcriptionInProgress) {
        console.log("Transcription process already in progress. Cannot start another.");
        return;
    }

    console.log("Transcription process started.");
    transcriptionInProgress = true;
    try {
        const fileInput = document.getElementById('audioFileInput');
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select an audio file.');
            transcriptionInProgress = false;
            return;
        }

        formData.append('audio', file);

        const transcribeBtn = document.getElementById('transcribeBtn');
        const fileInfoSection = document.getElementById('fileInfoSection');
        const transcriptionOutput = document.getElementById('transcriptionOutput');
        const downloadBtn = document.getElementById('downloadBtn');
        const anotheraudio = document.getElementById('anotheraudio');
      //  const cancel = document.getElementById('cancel');
        const tryanother = document.getElementById('tryanother');

        transcribeBtn.style.display = 'none';
        anotheraudio.style.display = 'none';

        circularProgress.style.display = 'block';
        progressValue.style.display = 'block';

      //  cancel.style.display = 'block';

        // Progress bar update logic
        const getRandomSpeed = (progress) => {
            if (progress >= 0 && progress < 42) {
                return Math.random() * (500 - 10) + 10;  // Random speed between 10 and 500 ms
            } else if (progress >= 48 && progress < 70) {
                return Math.random() * (1100 - 100) + 100;  // Random speed between 100 and 1000 ms
            } else if (progress >= 77 && progress < 90) {
                return Math.random() * (3000 - 1000) + 1000;  // Random speed between 1000 and 3000 ms
            } else if (progress >= 90) {
                return Math.random() * (6000 - 2000) + 2000;  // Random speed between 3000 and 5000 ms
            }
        };
        
        // Initial speed
        let speed = getRandomSpeed(progressStartValue);
        
        const updateProgress = () => {
            progressStartValue++;
            progressValue.textContent = `${progressStartValue}%`;
            circularProgress.style.background = `conic-gradient(#236ce1 ${progressStartValue * 3.6}deg, #ededed 0deg)`;
        
            if (progressStartValue >= progressEndValue) {
                clearInterval(intervalId);
            } else {
                clearInterval(intervalId);
                // Generate a new random speed for the next interval
                speed = getRandomSpeed(progressStartValue);
                intervalId = setInterval(updateProgress, speed);
            }
        };
        
        // Initialize the interval
        let intervalId = setInterval(updateProgress, speed);



        fetch('/transcribe', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                transcribeBtn.textContent = 'Transcribe';
                transcribeBtn.disabled = false;

                clearInterval(updateProgress);
                circularProgress.style.display = 'none';
                progressValue.style.display = 'none';

                if (data.transcription) {
                    transcriptionOutput.textContent = data.transcription;
                    const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
                    transcriptionOutput.innerHTML = `<strong>${fileNameWithoutExtension}</strong><br><br>${data.transcription}`;
               //     cancel.style.display = 'none';
                    downloadBtn.style.display = 'block';
                    tryanother.style.display = 'block';
                    fileInfoSection.style.display = 'none';
                    outputDisplayed = true;

                } else {
                    transcriptionOutput.textContent = "Transcription not available.";
                }

                transcriptionInProgress = false; // Transcription process completed
            })
            .catch(error => {
                console.error('Error:', error);
                transcribeBtn.textContent = 'Transcribe';
                transcribeBtn.disabled = false;
                transcriptionInProgress = false; // Transcription process ended with error
                window.location.href = '/error.html';
            });
    } catch (error) {
        console.error('Error:', error);
        transcriptionInProgress = false; // Transcription process ended with error
        window.location.href = '/error.html';
    }
}

function downloadTranscription() {
    const transcriptionOutput = document.getElementById('transcriptionOutput').textContent;

    const blob = new Blob([transcriptionOutput], { type: 'text/plain' });

    const downloadLink = document.createElement('a');
    downloadLink.download = 'transcription.txt';
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.click();
}

document.addEventListener('dragover', function (event) {
    event.preventDefault();
});

document.addEventListener('drop', function (event) {
    event.preventDefault();
    handleFileSelect(event);
});

const fileInput = document.getElementById('audioFileInput');
fileInput.addEventListener('change', handleFileSelect);

function reloadPage() {
    transcriptionInProgress = false; // Cancel transcription process if ongoing
    location.reload();
}
