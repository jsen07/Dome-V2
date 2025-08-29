import React, { useState } from "react";
import Placeholder from "./images/profile-placeholder-2.jpg";
import { useAuth } from "./contexts/AuthContext";
import {
  ref as sRef,
  getDownloadURL,
  getStorage,
  uploadBytes,
} from "firebase/storage";
import { getDatabase, ref, set, push } from "firebase/database";
import { useStateValue } from "./contexts/StateProvider";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ClearIcon from "@mui/icons-material/Clear";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import LocationSearchBox from "./LocationSearchBox";

const UploadPost = () => {
  const { currentUser } = useAuth();
  const user = useSelector((state) => state.user.activeUser);
  const [caption, setCaption] = useState("");
  const [option, setOption] = useState("Public");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [characters, setCharacters] = useState(250);
  const [remaining, setRemaining] = useState();
  const storage = getStorage();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (images.length + files.length > 5) {
      setError("You can only upload up to 5 photos.");
      return;
    }

    const validFiles = [];
    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG, JPEG, and PNG files are allowed.");
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    try {
      setIsLoading(true);
      const uploadedUrls = [];
      for (let img of images) {
        const fileRef = sRef(
          storage,
          `${user.uid}/${Date.now()}-${img.file.name}`
        );
        await uploadBytes(fileRef, img.file);
        const photoURL = await getDownloadURL(fileRef);
        uploadedUrls.push(photoURL);
      }
      setIsLoading(false);
      return uploadedUrls;
    } catch (error) {
      console.error(error);
    }
  };

  const post = async (e) => {
    e.preventDefault();
    if (!caption && images.length === 0) return;

    try {
      setIsLoading(true);
      const imageUrls = await uploadImages();

      const db = getDatabase();

      const postRef = ref(db, "Posts");
      const newPostRef = push(postRef);
      const key = newPostRef.key;

      const Post = {
        uid: user.uid,
        post: caption || "",
        timestamp: Date.now(),
        visibility: option,
        postKey: key,
        likes: [],
        imageUrls,
      };

      await set(newPostRef, Post);

      const userPostRef = ref(db, `UserPosts/${user.uid}/${key}`);
      await set(userPostRef, Post);

      setCaption("");
      setImages([]);
      setIsLoading(false);
      toast.success("Posted successfully!");
    } catch (error) {
      console.error("Error posting:", error);
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setOption(e.target.value);
  };

  const handleRetrieve = (res) => {
    const feature = res.features[0];

    const locationData = {
      name: feature?.properties?.name || "",
      address: feature?.properties?.full_address || "",
      coords: feature?.geometry?.coordinates || "", // [lng, lat]
    };

    console.log("Chosen location:", locationData);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-6 px-4 bg-neutral-950 rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold text-neutral-300 text-neutral-100 mb-4">
        Create a Post
      </h2>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <form onSubmit={post} className="flex flex-col gap-4">
        {/* <LocationSearchBox
          onSelect={(feature) => {
            const locationData = {
              name: feature.text,
              address: feature.place_name,
              coords: feature.geometry.coordinates,
            };
            console.log("Chosen location:", feature);
          }}
        /> */}
        {/* Upload Section */}
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center border-2 border-dashed border-neutral-500 rounded-xl cursor-pointer transition hover:bg-neutral-900 ${
            images.length > 0 ? "p-4" : "p-10"
          }`}
        >
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 w-full">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`preview-${index}`}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <ClearIcon
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full size-6 text-center p-1 opacity-0 group-hover:opacity-100 transition"
                  />
                </div>
              ))}
              {images.length < 5 && (
                <div className="flex items-center justify-center w-full h-28 border border-dashed border-neutral-400 rounded-lg text-neutral-500 text-sm">
                  + Add More
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-neutral-500">
              <div className="text-6xl">
                <FileUploadIcon style={{ fontSize: "inherit" }} />
              </div>
              <p className="text-sm font-semibold">
                Click or drag up to 5 images
              </p>
            </div>
          )}

          <input
            id="image-upload"
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <div className="h-14 w-full rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 text-sm">
          <select
            defaultValue="Public"
            disabled={!currentUser || isLoading}
            onChange={handleChange}
            className="w-full h-full bg-transparent focus:outline-none"
          >
            <option value="Public">Public</option>
            <option value="Friends">Friends Only</option>
          </select>
        </div>
        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setRemaining(characters - e.target.value.length);
          }}
          placeholder="Write a caption (optional)..."
          className="w-full p-3 rounded-lg border border-neutral-700 focus:ring-1 focus:ring-violet-400 focus:outline-none bg-neutral-800 text-neutral-100 text-sm resize-none"
          rows="6"
          maxLength={characters}
        />
        {remaining >= 0 && (
          <span className="text-xs text-neutral-500 ">
            {remaining} characters remaining
          </span>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="shadow-lg p-2 bg-violet-600 hover:bg-violet-500 transition rounded w-full text-white font-semibold disabled:opacity-50"
        >
          {isLoading ? "Posting..." : "Post"}
        </button>

        <p className="text-xs text-neutral-500 mt-2">
          {images.length}/5 photos selected
        </p>
      </form>
    </div>
  );
};

export default UploadPost;
