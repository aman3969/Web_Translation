import logging as lg
import datetime
import os

class log:
    def __init__(self):

        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        log_dir = f'Logs\\Log_{current_date}'
        os.makedirs(log_dir,exist_ok=True)
        log_filename = f'{log_dir }\\logs_{current_date}.log'
        lg.basicConfig(filename=log_filename, filemode='a', level=lg.INFO,format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = lg.getLogger()

    def Logg(self, msg):
        # Logging the message
        self.logger.info(msg)