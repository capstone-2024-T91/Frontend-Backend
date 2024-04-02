from flask import Flask, request, render_template
import glob
from flask_cors import CORS, cross_origin
from joblib import load
import numpy as np
#from tensorflow.keras.models import load_model
#from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle



app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/', methods=['GET', 'POST'])
@cross_origin()
def index():
    if request.method == 'POST':
        email = [request.form['experience']]
        #ML
        vectorizer_files = glob.glob('Vectorizers/*_vectorizer.joblib')
        #NN
       # with open('Tokenizers/tokenizer.pickle', 'rb') as handle:
         #   tokenizer = pickle.load(handle)
        #model = load_model('Neural_Networks/nn_phishing_model.keras')

        #output
        output = htmlToBeReturnedML(vectorizer_files, email)
        return render_template('index.html', prediction_text=output)
    return render_template('index.html')


def htmlToBeReturnedML(vectorizers, email):
    ##Get ML output first
    output = ""
    for vectorizer_file in vectorizers:
        # Identify the corresponding model file
        part_file = vectorizer_file.replace('Vectorizers', 'Classifiers')
        model_file = part_file.replace('_vectorizer.joblib', '.joblib')

        # Load the model
        model = load(model_file)

        # Load the vectorizer
        vectorizer = load(vectorizer_file)

        # Check if the model has the predict_proba method
        if hasattr(model, 'predict_proba'):
            # Make predictions with the model
            predictions = model.predict(email)

            # Get probabilities with the model
            probabilities = model.predict_proba(email)
            output += "Model: " + str(model_file) + "\n"
            for i, input_string in enumerate(email):
                output += "Prediction: " + str(predictions[i]) + ", Certainty: " + str(np.max(probabilities[i])) + "\n"
        else:
            output += "Model: " + str(model_file) + " does not support probability estimates" + "\n"
            # Make predictions with the model
            predictions = model.predict(email)
            for i, input_string in enumerate(email):
                output += "Nonetheless, the prediction is: " + str(predictions[i]) + "\n"
    #NN output Now
    #sequences = tokenizer.texts_to_sequences(test)
    #some_input_data = pad_sequences(sequences, maxlen=200)
    #prediction = model.predict(some_input_data)
    #average_prediction = prediction.mean()
    #certainties = np.abs(prediction - 0.5) * 2  # Scale the distance from 0.5 to a [0, 1] range
    #average_certainty = certainties.mean()

    # average prediction
    #output += "Average prediction probability: " + str(average_prediction)
    # average certainty
    #output += "Average certainty of prediction: " + str(average_certainty)
    return output

if __name__ == "__main__":
    app.run(debug=True)
