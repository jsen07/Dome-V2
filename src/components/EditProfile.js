import React, { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { ref, set } from "firebase/database";
import {
  ref as sRef,
  getDownloadURL,
  getStorage,
  uploadBytes,
} from "firebase/storage";
import { db } from "../firebase";
import { updateProfile } from "firebase/auth";
import Placeholder from "./images/profile-placeholder-2.jpg";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { setActiveUser } from "./store/userSlice";
import { useDispatch, useSelector } from "react-redux";
import ImageCropper from "./ImageCropper";

const EditProfile = ({
  userDetails,
  isCurrentUser,
  closebutton,
  updateUserProfile,
}) => {
  const { currentUser } = useAuth();
  const activeUser = useSelector((state) => state.user.activeUser);
  const storage = getStorage();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [characters] = useState(250);
  const [imageCropper, setImageCropper] = useState(false);

  const [displayName, setDisplayName] = useState(activeUser?.displayName || "");
  const [fullName, setFullName] = useState(activeUser?.fullName || "");
  const [gender, setGender] = useState(
    activeUser?.Gender || "Prefer not to say"
  );
  const [bio, setBio] = useState(activeUser?.Bio || "");
  const [remaining, setRemaining] = useState(
    characters - (activeUser?.Bio?.length || 0)
  );
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhoto(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleBackgroundChange = (e) => {
    if (e.target.files[0]) {
      handleBackgroundFile(e.target.files[0]);
    }
  };

  const handleBackgroundFile = async (backgroundImage) => {
    setLoading(true);
    const fileRef = sRef(storage, `${currentUser.uid}-backgroundImage.png`);

    try {
      await uploadBytes(fileRef, backgroundImage);
      const photoLink = await getDownloadURL(fileRef);

      await set(ref(db, `users/${currentUser.uid}/background`), {
        profileBackground: photoLink,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setLoading(false);
    }
  };

  const removeProfilePicture = () => {
    setNewPhoto(null);
    setPreviewPhoto(null);
  };

  const saveChanges = async () => {
    setLoading(true);

    try {
      let photoLink = activeUser?.photoUrl || "";

      if (newPhoto) {
        const fileRef = sRef(storage, `${currentUser.uid}.png`);
        await uploadBytes(fileRef, newPhoto);
        photoLink = await getDownloadURL(fileRef);
      }

      await updateProfile(currentUser, {
        displayName,
        photoURL: photoLink,
      });

      const updatedUser = {
        ...userDetails,
        Bio: bio,
        displayName,
        fullName,
        Gender: gender,
        photoUrl: photoLink,
      };

      await set(ref(db, `users/${currentUser.uid}`), updatedUser);

      dispatch(setActiveUser(updatedUser));

      closebutton();
    } catch (error) {
      console.error("Error saving changes:", error);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto pt-4 pb-2 px-4 bg-neutral-950 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-neutral-100">
            Edit Profile
          </h2>
          <button
            onClick={closebutton}
            className="flex items-center gap-1 bg-neutral-800 text-white px-3 py-1 rounded-lg hover:bg-neutral-700 transition"
          >
            Close <CloseRoundedIcon fontSize="small" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3">
            <img
              alt="avatar"
              src={previewPhoto || userDetails?.photoUrl || Placeholder}
              className="w-full h-full object-cover rounded-full aspect-square border border-neutral-700"
            />
          </div>
          <div className="flex flex-col items-center text-sm text-neutral-500">
            {isCurrentUser && !previewPhoto && (
              <label className="px-4 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition text-white cursor-pointer">
                Change Photo
                <input
                  type="file"
                  disabled={!isCurrentUser}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            {previewPhoto && (
              <button
                onClick={removeProfilePicture}
                className="px-4 py-1 rounded-2xl bg-red-600 hover:bg-red-500 transition text-white"
              >
                Remove New Photo
              </button>
            )}
          </div>
        </div>

        <div className="w-full flex justify-end">
          <button
            className="px-4 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition text-white cursor-pointer"
            onClick={() => {
              setImageCropper(true);
            }}
          >
            {" "}
            Change Banner
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex flex-col">
            <label className="text-sm text-neutral-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isCurrentUser}
              className="h-10 w-full p-3 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 text-sm focus:ring-1 focus:ring-violet-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-neutral-400 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isCurrentUser}
              className="h-10 w-full p-3 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 text-sm focus:ring-1 focus:ring-violet-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-neutral-400 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={!isCurrentUser}
              className="w-full h-12 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 text-sm focus:ring-1 focus:ring-violet-400 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col mb-6">
          <label className="text-sm text-neutral-400 mb-1">Biography</label>
          <textarea
            rows="4"
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setRemaining(characters - e.target.value.length);
            }}
            disabled={!isCurrentUser}
            maxLength={characters}
            className="w-full p-3 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 text-sm focus:ring-1 focus:ring-violet-400 focus:outline-none resize-none"
          />
          <span className="text-xs text-neutral-500 mt-1">
            {remaining} characters remaining
          </span>
        </div>

        {isCurrentUser && (
          <button
            onClick={saveChanges}
            disabled={loading}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
      {imageCropper && <ImageCropper setImageCropper={setImageCropper} />}
    </>
  );
};

export default EditProfile;
