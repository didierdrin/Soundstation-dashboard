import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {  storage, firestore as db, auth } from "../../firebaseApp";


interface LicenseType {
  type: string;
  price: number;
  rights: string[];
}

interface Beat {
  title: string;
  producerId: string;
  producerName: string;
  audioUrl: string;
  previewUrl: string;
  duration: number;
  genre: string;
  tags: string[];
  bpm: number;
  price: number;
  licenseTypes: {
    [key: string]: LicenseType;
  };
  plays: number;
  purchases: number;
  likes: number;
  createdAt: any;
  updatedAt: any;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  searchKeywords: string[];
}

type BeatWithId = {
  id: string;
  data: Beat;
};

const Library = () => {
  const [beats, setBeats] = useState<BeatWithId[]>([]);
  const [editingBeat, setEditingBeat] = useState<BeatWithId | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [newBeat, setNewBeat] = useState<Partial<Beat>>({
    title: "",
    genre: "",
    tags: [],
    bpm: 0,
    price: 0,
    licenseTypes: {
      basic: {
        type: "Basic",
        price: 0,
        rights: []
      }
    },
    isActive: true,
    isFeatured: false,
    searchKeywords: []
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "beats"), (snapshot) => {
      setBeats(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as Beat,
        }))
      );
    });
    return () => unsubscribe();
  }, []);

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleAddBeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please sign in to upload beats");
      return;
    }
    
    if (!audioFile || !newBeat.title || !newBeat.genre) {
      alert("Please fill in all required fields and upload an audio file");
      return;
    }

    setLoading(true);
    try {
      // Upload files
      const audioUrl = await uploadFile(audioFile, `beats/${auth.currentUser.uid}/${Date.now()}-full.mp3`);
      const previewUrl = previewFile 
        ? await uploadFile(previewFile, `beats/${auth.currentUser.uid}/${Date.now()}-preview.mp3`)
        : audioUrl;
      const imageUrl = imageFile 
        ? await uploadFile(imageFile, `beats/${auth.currentUser.uid}/${Date.now()}-cover.jpg`)
        : "";

      // Create searchKeywords
      const searchKeywords = [
        newBeat.title?.toLowerCase(),
        newBeat.genre?.toLowerCase(),
        auth.currentUser.displayName?.toLowerCase(),
        ...(newBeat.tags?.map(tag => tag.toLowerCase()) || [])
      ].filter(Boolean);

      // Add document to Firestore
      await addDoc(collection(db, "beats"), {
        ...newBeat,
        producerId: auth.currentUser.uid,
        producerName: auth.currentUser.displayName,
        audioUrl,
        previewUrl,
        imageUrl,
        duration: 0, // You might want to calculate this using audio metadata
        plays: 0,
        purchases: 0,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        searchKeywords
      });

      // Reset form
      setNewBeat({
        title: "",
        genre: "",
        tags: [],
        bpm: 0,
        price: 0,
        licenseTypes: {
          basic: {
            type: "Basic",
            price: 0,
            rights: []
          }
        },
        isActive: true,
        isFeatured: false,
        searchKeywords: []
      });
      setAudioFile(null);
      setPreviewFile(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error adding beat: ", error);
      alert("Failed to add beat");
    }
    setLoading(false);
  };

  const handleDeleteBeat = async (id: string) => {
    if (!confirm("Are you sure you want to delete this beat?")) return;

    try {
      await deleteDoc(doc(db, "beats", id));
    } catch (error) {
      console.error("Error deleting beat: ", error);
      alert("Failed to delete beat");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Beat Upload</h3>

      <form onSubmit={handleAddBeat} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Beat Title"
            value={newBeat.title}
            onChange={(e) => setNewBeat({ ...newBeat, title: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Genre"
            value={newBeat.genre}
            onChange={(e) => setNewBeat({ ...newBeat, genre: e.target.value })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="BPM"
            value={newBeat.bpm || ""}
            onChange={(e) => setNewBeat({ ...newBeat, bpm: parseInt(e.target.value) })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Price (USD)"
            value={newBeat.price || ""}
            onChange={(e) => setNewBeat({ ...newBeat, price: parseFloat(e.target.value) })}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            onChange={(e) => setNewBeat({ 
              ...newBeat, 
              tags: e.target.value.split(",").map(tag => tag.trim()) 
            })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-1">Full Beat Audio</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preview Audio (optional)</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newBeat.isActive}
              onChange={(e) => setNewBeat({ ...newBeat, isActive: e.target.checked })}
              className="mr-2"
            />
            Active
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newBeat.isFeatured}
              onChange={(e) => setNewBeat({ ...newBeat, isFeatured: e.target.checked })}
              className="mr-2"
            />
            Featured
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Beat"}
        </button>
      </form>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Uploaded Beats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beats.map(({ id, data }) => (
            <div key={id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{data.title}</h4>
                <span className="font-medium text-green-600">${data.price}</span>
              </div>
              <p className="text-sm text-gray-600">Genre: {data.genre}</p>
              <p className="text-sm text-gray-600">BPM: {data.bpm}</p>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleDeleteBeat(id)}
                  className="text-red-500 hover:text-red-700 font-medium transition duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;

// // Library
// import { useState, useEffect } from "react";
// import {
//   collection,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
// } from "firebase/firestore";
// import { firestore as db } from "../../firebaseApp";

// interface GarmentType {
//   name: string;
//   price: number;
// }

// type GarmentTypeWithId = {
//   id: string;
//   data: GarmentType;
// };

// const Library = () => {
//   const [garmentTypes, setGarmentTypes] = useState<GarmentTypeWithId[]>([]);
//   const [editingGarment, setEditingGarment] = useState<GarmentTypeWithId | null>(null);
//   const [newGarment, setNewGarment] = useState<GarmentType>({
//     name: "",
//     price: 0,
//   });

//   useEffect(() => {
//     const unsubscribe = onSnapshot(collection(db, "garmentTypeCleaned"), (snapshot) => {
//       setGarmentTypes(
//         snapshot.docs.map((doc) => ({
//           id: doc.id,
//           data: doc.data() as GarmentType,
//         }))
//       );
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleAddGarment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newGarment.name || newGarment.price <= 0) {
//       alert("Please fill in all fields with valid values");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "garmentTypeCleaned"), {
//         name: newGarment.name,
//         price: newGarment.price,
//       });
//       setNewGarment({
//         name: "",
//         price: 0,
//       });
//     } catch (error) {
//       console.error("Error adding garment type: ", error);
//       alert("Failed to add garment type");
//     }
//   };

//   const handleUpdateGarment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingGarment) return;

//     try {
//       await updateDoc(doc(db, "garmentTypeCleaned", editingGarment.id), {
//         name: editingGarment.data.name,
//         price: editingGarment.data.price,
//       });
//       setEditingGarment(null);
//     } catch (error) {
//       console.error("Error updating garment type: ", error);
//       alert("Failed to update garment type");
//     }
//   };

//   const handleDeleteGarment = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this garment type?")) return;

//     try {
//       await deleteDoc(doc(db, "garmentTypeCleaned", id));
//     } catch (error) {
//       console.error("Error deleting garment type: ", error);
//       alert("Failed to delete garment type");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h3 className="text-xl font-semibold mb-4">Garment Types Management</h3>

//       <form onSubmit={handleAddGarment} className="mb-8">
//         <h4 className="text-lg font-medium mb-4">Add New Garment Type</h4>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input
//             type="text"
//             placeholder="Garment Name"
//             value={newGarment.name}
//             onChange={(e) =>
//               setNewGarment({ ...newGarment, name: e.target.value })
//             }
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//           <input
//             type="number"
//             placeholder="Price (RWF)"
//             value={newGarment.price === 0 ? '' : newGarment.price}
//             onChange={(e) =>
//               setNewGarment({
//                 ...newGarment,
//                 price: parseFloat(e.target.value) || 0,
//               })
//             }
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//         <button
//           type="submit"
//           className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200"
//         >
//           Add Garment Type
//         </button>
//       </form>

//       <div className="mb-6">
//         <h3 className="text-lg font-medium mb-4">Current Garment Types</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {garmentTypes.map(({ id, data }) => (
//             <div key={id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
//               <div className="flex justify-between items-start mb-3">
//                 <h4 className="font-semibold text-lg">{data.name}</h4>
//                 <span className="font-medium text-green-600">RWF {data.price.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-end space-x-3 mt-4">
//                 <button
//                   onClick={() => setEditingGarment({ id, data })}
//                   className="text-blue-500 hover:text-blue-700 font-medium transition duration-200"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDeleteGarment(id)}
//                   className="text-red-500 hover:text-red-700 font-medium transition duration-200"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Edit Modal */}
//       {editingGarment && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-xl font-semibold mb-4">Edit Garment Type</h3>
//             <form onSubmit={handleUpdateGarment} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Name</label>
//                 <input
//                   type="text"
//                   value={editingGarment.data.name}
//                   onChange={(e) =>
//                     setEditingGarment({
//                       ...editingGarment,
//                       data: { ...editingGarment.data, name: e.target.value },
//                     })
//                   }
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1">Price (RWF)</label>
//                 <input
//                   type="number"
//                   value={editingGarment.data.price}
//                   onChange={(e) =>
//                     setEditingGarment({
//                       ...editingGarment,
//                       data: {
//                         ...editingGarment.data,
//                         price: parseFloat(e.target.value) || 0,
//                       },
//                     })
//                   }
//                   className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="flex justify-end space-x-3 mt-6">
//                 <button
//                   type="button"
//                   onClick={() => setEditingGarment(null)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
//                 >
//                   Update
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Library;
