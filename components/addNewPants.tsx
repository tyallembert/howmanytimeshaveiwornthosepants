import { useState } from "react";
import { db, storage } from "../firebase/config"; // Make sure to configure Firebase correctly
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "firebase/auth";

const AddPantsForm = ({ user }: { user: null | User }) => {
  const [showing, setShowing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleAddPants = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !image) {
      setError("Please fill in all fields and upload an image");
      return;
    }

    try {
      if (user) {
        // Upload the image to Firebase Storage
        const imageRef = ref(
          storage,
          `pants-images/${Date.now()}-${image.name}`
        );
        await uploadBytes(imageRef, image);

        // Get the image URL after upload
        const imageUrl = await getDownloadURL(imageRef);

        // Add the pants info to Firestore
        await addDoc(collection(db, "pants"), {
          userId: user.uid,
          name,
          imageUrl,
        });

        setName("");
        setImage(null);
        setSuccess("Pants added successfully!");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add pants. Please try again.");
        console.error("Error adding pants:", err);
      } else {
        setError("An unknown error occurred.");
        console.error("Unknown error adding pants:", err);
      }
    }
  };

  return !showing ? (
    <button
        className="w-fit px-4 py-2 mt-4 text-white bg-primary rounded-md hover:bg-primary/80"
        onClick={() => setShowing(true)}
    >
        Add Pants
    </button>
  ) : (
    <div className="w-1/2 rounded-xl border shadow p-3 bg-secondary">
      <h2>Add New Pair of Pants</h2>
      <form onSubmit={handleAddPants} className="space-y-4">
        <div>
          <label className="block text-sm text-white">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-white">Upload Image</label>
          <input
            type="file"
            onChange={(e) =>
              setImage(e.target.files ? e.target.files[0] : null)
            }
            className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-md"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-">{success}</p>}
        <div className="flex gap-2">
            <button
            type="submit"
            className="w-2/3 p-3 text-white bg-primary rounded-md hover:bg-primary/80"
            >
            Save Pants
            </button>
            <button
            className="w-1/3 border border-muted-foreground rounded p-3" 
            onClick={() => setShowing(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddPantsForm;
