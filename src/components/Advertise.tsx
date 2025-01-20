// Advertise
import { useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { firestore as db } from '../../firebaseApp';

const Advertise = () => {
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    image_url: '',
    target_audience: '',
    start_date: '',
    end_date: '',
    budget: '',
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setAdData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'advertise'), adData);
      alert('Advertisement added successfully!');
      setAdData({
        title: '',
        description: '',
        image_url: '',
        target_audience: '',
        start_date: '',
        end_date: '',
        budget: '',
      });
    } catch (error) {
      console.error('Error adding advertisement: ', error);
      alert('Error adding advertisement. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Create Advertisement</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-1">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={adData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={adData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="image_url" className="block mb-1">Image URL</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={adData.image_url}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="target_audience" className="block mb-1">Target Audience</label>
          <input
            type="text"
            id="target_audience"
            name="target_audience"
            value={adData.target_audience}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="start_date" className="block mb-1">Start Date</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={adData.start_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block mb-1">End Date</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={adData.end_date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="budget" className="block mb-1">Budget</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={adData.budget}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create Advertisement
        </button>
      </form>
    </div>
  );
};

export default Advertise;