// help
import { useState } from 'react';
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { firestore as db } from '../../firebaseApp';

const Help = () => {
  const [suggestion, setSuggestion] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    try {
      await addDoc(collection(db, 'suggestions'), {
        text: suggestion,
        createdAt: new Date()
      });
      alert('Thank you for your suggestion!');
      setSuggestion('');
    } catch (error) {
      console.error('Error submitting suggestion: ', error);
      alert('Error submitting suggestion. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Help & Suggestions</h3>
      <p className="mb-4">
        We value your feedback! If you have any suggestions or need help, please feel free to leave a message below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="suggestion" className="block mb-1">Your Suggestion</label>
          <textarea
            id="suggestion"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Submit Suggestion
        </button>
      </form>
    </div>
  );
};

export default Help;