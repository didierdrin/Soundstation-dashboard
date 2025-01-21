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
import { storage, firestore as db, auth } from "../../firebaseApp";

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
    producerName: "", // Added producerName field
    genre: "",
    tags: [],
    bpm: 0,
    price: 0,
    licenseTypes: {
      basic: {
        type: "Basic",
        price: 0,
        rights: [],
      },
    },
    isActive: true,
    isFeatured: false,
    searchKeywords: [],
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

    if (!audioFile || !newBeat.title || !newBeat.genre || !newBeat.producerName) {
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
        newBeat.producerName?.toLowerCase(),
        ...(newBeat.tags?.map((tag) => tag.toLowerCase()) || []),
      ].filter(Boolean);

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "beats"), {
        ...newBeat,
        producerId: auth.currentUser.uid,
        producerName: newBeat.producerName, // Use producerName from the form
        audioUrl,
        previewUrl,
        imageUrl,
        duration: 0, // You might want to calculate this using audio metadata
        plays: 0,
        purchases: 0,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        searchKeywords,
      });

      // Update the document to include the generated ID
      await updateDoc(docRef, { id: docRef.id });

      // Reset form
      setNewBeat({
        title: "",
        producerName: "",
        genre: "",
        tags: [],
        bpm: 0,
        price: 0,
        licenseTypes: {
          basic: {
            type: "Basic",
            price: 0,
            rights: [],
          },
        },
        isActive: true,
        isFeatured: false,
        searchKeywords: [],
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
            placeholder="Producer Name"
            value={newBeat.producerName}
            onChange={(e) => setNewBeat({ ...newBeat, producerName: e.target.value })}
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
            onChange={(e) =>
              setNewBeat({
                ...newBeat,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              })
            }
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
            <div
              key={id}
              className="border rounded-lg p-4 hover:shadow-md transition duration-200"
            >
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


// import { useState, useEffect } from "react";
// import {
//   collection,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import {  storage, firestore as db, auth } from "../../firebaseApp";


// interface LicenseType {
//   type: string;
//   price: number;
//   rights: string[];
// }

// interface Beat {
//   title: string;
//   producerId: string;
//   producerName: string;
//   audioUrl: string;
//   previewUrl: string;
//   duration: number;
//   genre: string;
//   tags: string[];
//   bpm: number;
//   price: number;
//   licenseTypes: {
//     [key: string]: LicenseType;
//   };
//   plays: number;
//   purchases: number;
//   likes: number;
//   createdAt: any;
//   updatedAt: any;
//   imageUrl: string;
//   isActive: boolean;
//   isFeatured: boolean;
//   searchKeywords: string[];
// }

// type BeatWithId = {
//   id: string;
//   data: Beat;
// };

// const Library = () => {
//   const [beats, setBeats] = useState<BeatWithId[]>([]);
//   const [editingBeat, setEditingBeat] = useState<BeatWithId | null>(null);
//   const [audioFile, setAudioFile] = useState<File | null>(null);
//   const [previewFile, setPreviewFile] = useState<File | null>(null);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);

//   const [newBeat, setNewBeat] = useState<Partial<Beat>>({
//     title: "",
//     genre: "",
//     tags: [],
//     bpm: 0,
//     price: 0,
//     licenseTypes: {
//       basic: {
//         type: "Basic",
//         price: 0,
//         rights: []
//       }
//     },
//     isActive: true,
//     isFeatured: false,
//     searchKeywords: []
//   });

//   useEffect(() => {
//     const unsubscribe = onSnapshot(collection(db, "beats"), (snapshot) => {
//       setBeats(
//         snapshot.docs.map((doc) => ({
//           id: doc.id,
//           data: doc.data() as Beat,
//         }))
//       );
//     });
//     return () => unsubscribe();
//   }, []);

//   const uploadFile = async (file: File, path: string) => {
//     const storageRef = ref(storage, path);
//     await uploadBytes(storageRef, file);
//     return getDownloadURL(storageRef);
//   };

//   const handleAddBeat = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!auth.currentUser) {
//       alert("Please sign in to upload beats");
//       return;
//     }
    
//     if (!audioFile || !newBeat.title || !newBeat.genre) {
//       alert("Please fill in all required fields and upload an audio file");
//       return;
//     }

//     setLoading(true);
//     try {
//       // Upload files
//       const audioUrl = await uploadFile(audioFile, `beats/${auth.currentUser.uid}/${Date.now()}-full.mp3`);
//       const previewUrl = previewFile 
//         ? await uploadFile(previewFile, `beats/${auth.currentUser.uid}/${Date.now()}-preview.mp3`)
//         : audioUrl;
//       const imageUrl = imageFile 
//         ? await uploadFile(imageFile, `beats/${auth.currentUser.uid}/${Date.now()}-cover.jpg`)
//         : "";

//       // Create searchKeywords
//       const searchKeywords = [
//         newBeat.title?.toLowerCase(),
//         newBeat.genre?.toLowerCase(),
//         auth.currentUser.displayName?.toLowerCase(),
//         ...(newBeat.tags?.map(tag => tag.toLowerCase()) || [])
//       ].filter(Boolean);

//       // Add document to Firestore
//       await addDoc(collection(db, "beats"), {
//         ...newBeat,
//         producerId: auth.currentUser.uid,
//         producerName: auth.currentUser.displayName,
//         audioUrl,
//         previewUrl,
//         imageUrl,
//         duration: 0, // You might want to calculate this using audio metadata
//         plays: 0,
//         purchases: 0,
//         likes: 0,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         searchKeywords
//       });

//       // Reset form
//       setNewBeat({
//         title: "",
//         genre: "",
//         tags: [],
//         bpm: 0,
//         price: 0,
//         licenseTypes: {
//           basic: {
//             type: "Basic",
//             price: 0,
//             rights: []
//           }
//         },
//         isActive: true,
//         isFeatured: false,
//         searchKeywords: []
//       });
//       setAudioFile(null);
//       setPreviewFile(null);
//       setImageFile(null);
//     } catch (error) {
//       console.error("Error adding beat: ", error);
//       alert("Failed to add beat");
//     }
//     setLoading(false);
//   };

//   const handleDeleteBeat = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this beat?")) return;

//     try {
//       await deleteDoc(doc(db, "beats", id));
//     } catch (error) {
//       console.error("Error deleting beat: ", error);
//       alert("Failed to delete beat");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h3 className="text-xl font-semibold mb-4">Beat Upload</h3>

//       <form onSubmit={handleAddBeat} className="mb-8 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <input
//             type="text"
//             placeholder="Beat Title"
//             value={newBeat.title}
//             onChange={(e) => setNewBeat({ ...newBeat, title: e.target.value })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             placeholder="Genre"
//             value={newBeat.genre}
//             onChange={(e) => setNewBeat({ ...newBeat, genre: e.target.value })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="number"
//             placeholder="BPM"
//             value={newBeat.bpm || ""}
//             onChange={(e) => setNewBeat({ ...newBeat, bpm: parseInt(e.target.value) })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="number"
//             placeholder="Price (USD)"
//             value={newBeat.price || ""}
//             onChange={(e) => setNewBeat({ ...newBeat, price: parseFloat(e.target.value) })}
//             className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="space-y-2">
//           <input
//             type="text"
//             placeholder="Tags (comma-separated)"
//             onChange={(e) => setNewBeat({ 
//               ...newBeat, 
//               tags: e.target.value.split(",").map(tag => tag.trim()) 
//             })}
//             className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="space-y-2">
//           <div>
//             <label className="block text-sm font-medium mb-1">Full Beat Audio</label>
//             <input
//               type="file"
//               accept="audio/*"
//               onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Preview Audio (optional)</label>
//             <input
//               type="file"
//               accept="audio/*"
//               onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium mb-1">Cover Image (optional)</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => setImageFile(e.target.files?.[0] || null)}
//               className="w-full"
//             />
//           </div>
//         </div>

//         <div className="flex items-center space-x-4">
//           <label className="flex items-center">
//             <input
//               type="checkbox"
//               checked={newBeat.isActive}
//               onChange={(e) => setNewBeat({ ...newBeat, isActive: e.target.checked })}
//               className="mr-2"
//             />
//             Active
//           </label>
//           <label className="flex items-center">
//             <input
//               type="checkbox"
//               checked={newBeat.isFeatured}
//               onChange={(e) => setNewBeat({ ...newBeat, isFeatured: e.target.checked })}
//               className="mr-2"
//             />
//             Featured
//           </label>
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-200 disabled:opacity-50"
//         >
//           {loading ? "Uploading..." : "Upload Beat"}
//         </button>
//       </form>

//       <div className="mb-6">
//         <h3 className="text-lg font-medium mb-4">Uploaded Beats</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {beats.map(({ id, data }) => (
//             <div key={id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
//               <div className="flex justify-between items-start mb-3">
//                 <h4 className="font-semibold text-lg">{data.title}</h4>
//                 <span className="font-medium text-green-600">${data.price}</span>
//               </div>
//               <p className="text-sm text-gray-600">Genre: {data.genre}</p>
//               <p className="text-sm text-gray-600">BPM: {data.bpm}</p>
//               <div className="flex justify-end space-x-3 mt-4">
//                 <button
//                   onClick={() => handleDeleteBeat(id)}
//                   className="text-red-500 hover:text-red-700 font-medium transition duration-200"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Library;
