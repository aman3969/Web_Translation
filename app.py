import asyncio
from flask import Flask, render_template, request, jsonify,redirect, url_for
from werkzeug.utils import secure_filename
from dotenv import dotenv_values
import os
import datetime
from model import WhisperModel
from logs import log
import time


app = Flask(__name__)

app.config['TEMPLATES_AUTO_RELOAD'] = True

# Configure Logging
logger = log()
configenv = dotenv_values('.env')
# Model cache dictionary
model_cache = {}

current_date = datetime.datetime.now().strftime("%Y-%m-%d")
# Configure the path to save uploaded files
UPLOAD_FOLDER = os.path.join(os.getcwd(), f'uploads/uploads_{current_date}')

# Save files in the 'uploads' folder in the current directory
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    logger.Logg("Visited index page")
    return render_template('index.html')

async def load_model():
    try :
        if 'model' not in model_cache :
            logger.Logg(f"Loading model for the first time:")
            model = WhisperModel()
            model_cache['model'] = model.pipelined()
        else:
            logger.Logg(f"Using cached model:")
        return  model_cache['model']
    except Exception as e :
        logger.Logg(f"Error occured in loading model : {e}")
        return None

@app.route('/transcribe', methods=['POST'])
async def transcribe():
    logger.Logg("Received a transcription request")

    audio_file = request.files.get('audio')

    if audio_file is None:
        logger.Logg("No audio file provided")
        return jsonify({'error': 'No audio file provided'}), 400

    if audio_file.filename == '':
        logger.Logg("No selected audio file")
        return jsonify({'error': 'No selected audio file'}), 400
    
    logger.Logg("Audio file received: {}".format(audio_file.filename))

    try :
        filename = secure_filename(audio_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        audio_file.save(filepath)
        logger.Logg("Audio file saved to upload folder")
    except Exception as e :
        logger.Logg(f"Error Saving audio File : {e}")

    try :
        pipe = await load_model()
        logger.Logg("model loaded ")
    except Exception as e:
        logger.Logg(f"error loading model {e}")

    try:
        # Perform transcription
        logger.Logg("Transcription in progress")

        st_time = time.time()
        result = await asyncio.to_thread(pipe,filepath, generate_kwargs={"task":"translate"})
        e_time = time.time()
        logger.Logg(f"time taken : {e_time-st_time}")

        transcription = result['text']

        logger.Logg("Transcription completed:")
        return jsonify({'transcription': transcription})
    except Exception as e:
        logger.Logg("Error during transcription: {}".format(str(e)))
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def page_not_found(e):
    logger.Logg(f"Exception occurred: {e}")
    return render_template('error.html', error_code=404), 404

@app.errorhandler(500)
def internal_server_error(e):
    logger.Logg(f"Exception occurred: {e}")
    return render_template('error.html', error_code=500), 500

@app.errorhandler(Exception)
def handle_exception(e):
    logger.Logg(f"Exception occurred: {e}")
    return render_template('error.html', error_code=500), 500

if __name__ == '__main__':
    app.run(debug=True)
