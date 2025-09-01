import React, { useState, useEffect, useRef } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { db } from "../firebase";
import {
  getDownloadURL,
  ref,
  uploadString,
  getStorage,
} from "firebase/storage";
import { set, ref as dbRef } from "firebase/database";
import { useSelector, useDispatch } from "react-redux";
import { updateActiveUser } from "./store/userSlice";
import imageCompression from "browser-image-compression";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { toast } from "react-toastify";

const ASPECT_RATIO = 16 / 5;

const ImageCropper = ({ setImageCropper }) => {
  const dispatch = useDispatch();
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.activeUser);
  const storage = getStorage();

  const [image, setImage] = useState(null);
  const [scaledImage, setScaledImage] = useState(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG and PNG images are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageUrl = reader.result.toString();
      setImgSrc(imageUrl);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setImage(img);
    });
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image) {
      const maxWidth = 1600;
      const scale = image.width > maxWidth ? maxWidth / image.width : 1;
      setScaleFactor(scale);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

      setScaledImage(canvas.toDataURL());
    }
  }, [image]);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const containerWidth = containerRef.current?.offsetWidth || width;

    const cropWidth = Math.min(containerWidth, width);
    const cropHeight = cropWidth / ASPECT_RATIO;

    setCrop({
      unit: "px",
      width: cropWidth,
      height: cropHeight,
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
    });
  };

  const uploadCroppedImage = async () => {
    if (!imgRef.current || !crop) return;
    if (loading) return;

    setLoading(true);
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL("image/png");

    try {
      const croppedImageFile = await fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => new File([blob], "banner.png", { type: "image/png" }));

      const compressedFile = await compressImage(croppedImageFile);
      if (!compressedFile) throw new Error("Failed to compress the image.");

      const compressedFileDataURL = await convertFileToDataURL(compressedFile);
      const userId = user.uid;
      const storageRef = ref(
        storage,
        `background-images/${userId}-background.png`
      );

      await uploadString(storageRef, compressedFileDataURL, "data_url", {
        contentType: "image/png",
      });

      const downloadUrl = await getDownloadURL(storageRef);
      await set(dbRef(db, `users/${userId}/background`), {
        profileBackground: downloadUrl,
      });

      setLoading(false);
      setCrop(null);
      setImageCropper(false);
      dispatch(
        updateActiveUser({ background: { profileBackground: downloadUrl } })
      );
      toast.success("Profile Banner has been saved.");
    } catch (error) {
      toast.error("Error uploading cropped image");
      setLoading(false);
    }
  };

  const compressImage = async (imageFile) => {
    try {
      return await imageCompression(imageFile, {
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        maxSizeMB: 1,
        quality: 0.85,
        maxIteration: 10,
      });
    } catch (error) {
      console.error("Compression failed:", error);
      return null;
    }
  };

  const convertFileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="absolute top-0 left-0 w-full min-h-screen py-2 pb-20 bg-neutral-950">
      <div className="w-full flex-row flex justify-between my-4 px-2 ">
        <h2 className="text-2xl font-semibold text-neutral-100">
          Upload Background
        </h2>
        <button
          onClick={() => {
            setImageCropper(false);
          }}
          className="flex items-center gap-1 bg-neutral-800 text-white px-3 py-1 rounded-lg hover:bg-neutral-700 transition"
        >
          Close <CloseRoundedIcon fontSize="small" />
        </button>
      </div>
      <label className="mx-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition text-white cursor-pointer">
        Choose Banner photo
        {!loading && (
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={onSelectFile}
            className="hidden"
            disabled={loading}
          />
        )}
      </label>

      {scaledImage && (
        <>
          <div
            ref={containerRef}
            className="w-full max-h-[520px] mb-4 mt-4 border border-neutral-700 rounded-lg overflow-hidden"
          >
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCrop}
              aspect={ASPECT_RATIO}
              keepSelection
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={scaledImage}
                alt="upload"
                className="w-full h-full object-contain"
                onLoad={onImageLoad}
                draggable={true}
              />
            </ReactCrop>
          </div>
          <button
            onClick={uploadCroppedImage}
            disabled={loading}
            className="w-full p-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Banner"}
          </button>
        </>
      )}
    </div>
  );
};

export default ImageCropper;
