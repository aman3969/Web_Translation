# whisper model processing class
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from dotenv import dotenv_values

class WhisperModel:

    def __init__(self):
        self.config = dotenv_values('.env')
        self.model_save_path = self.config['arabic_model_path']
        self.processor_save_path = self.config['arabic_processor_path']
        print("model loaded")
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.batch_size = 8
        self.compute_type = 'int8'
        self.torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        self.model_l = AutoModelForSpeechSeq2Seq.from_pretrained(self.model_save_path, torch_dtype=self.torch_dtype, use_safetensors=True).to(self.device)
        self.processor_l = AutoProcessor.from_pretrained(self.processor_save_path)
        
    def pipelined(self):
            pipe = pipeline(
        "automatic-speech-recognition",
        model=self.model_l,
        tokenizer=self.processor_l.tokenizer,
        feature_extractor=self.processor_l.feature_extractor,
        max_new_tokens=128,
        chunk_length_s=30,
        batch_size=16,
        return_timestamps=True,
        torch_dtype=self.torch_dtype,
        device=self.device,
            )
            return pipe