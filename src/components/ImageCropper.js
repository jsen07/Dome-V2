import React, { useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import { db } from "../firebase";
import {
  getDownloadURL,
  ref,
  uploadString,
  getStorage,
} from "firebase/storage";
import { set, ref as dbRef } from "firebase/database";
import { useStateValue } from "./contexts/StateProvider";
import imageCompression from "browser-image-compression";

import HeightIcon from "@mui/icons-material/Height";

const MIN_DIMENSION = 1080; // Minimum width for cropping
const MIN_HEIGHT = 250; // Minimum height for cropping
const ASPECT_RATIO = 250 / 1080; // Aspect ratio of 250x1080 (width/height)

const ImageCropper = () => {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [{ user }] = useStateValue();
  const storage = getStorage();

  const [image, setImage] = useState(null);
  const [scaledImage, setScaledImage] = useState(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageUrl = reader.result.toString();
      setImgSrc(imageUrl);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setImage(img);
      };
    });
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image) {
      const maxWidth = 1200;
      const scale = image.width > maxWidth ? maxWidth / image.width : 1;
      setScaleFactor(scale);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

      const scaledImageUrl = canvas.toDataURL();
      setScaledImage(scaledImageUrl);
    }
  }, [image]);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = {
      unit: "px",
      width: MIN_DIMENSION * scaleFactor,
      height: MIN_HEIGHT * scaleFactor,
      x: (width - MIN_DIMENSION * scaleFactor) / 2,
      y: (height - MIN_HEIGHT * scaleFactor) / 2,
    };
    setCrop(initialCrop);
  };

  const getCroppedImage = () => {
    if (!crop || !imgSrc) return;

    const image = new Image();
    image.src = imgSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = crop.width / scaleFactor;
      canvas.height = crop.height / scaleFactor;

      ctx.drawImage(
        image,
        crop.x / scaleFactor,
        crop.y / scaleFactor,
        crop.width / scaleFactor,
        crop.height / scaleFactor,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const croppedImageUrl = canvas.toDataURL("image/png");
      setCroppedImageUrl(croppedImageUrl);
    };
  };

  const uploadCroppedImage = async () => {
    if (!croppedImageUrl || loading) return;

    setLoading(true);

    try {
      const croppedImageFile = await fetch(croppedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          return new File([blob], "cropped_image.png", { type: "image/png" });
        });

      const compressedFile = await compressImage(croppedImageFile);

      if (!compressedFile) {
        setLoading(false);
        alert("Failed to compress the image.");
        return;
      }

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
      alert("Background image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      setLoading(false);
    }
  };

  const aspectRatio = image ? image.width / image.height : 1;

  const handleResize = (e) => {
    const newWidth = e.clientX - e.target.getBoundingClientRect().left;
    const newHeight = newWidth * ASPECT_RATIO;
    setCrop({
      ...crop,
      width: newWidth,
      height: newHeight,
    });
  };

  const startResize = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };

  const stopResize = () => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
  };

  const compressImage = async (imageFile) => {
    try {
      const options = {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        maxSizeMB: 1,
        quality: 0.85,
        maxIteration: 10,
      };

      const compressedFile = await imageCompression(imageFile, options);

      return compressedFile;
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
    <div>
      <h1>Image Cropper</h1>
      <input type="file" accept="image/*" onChange={onSelectFile} />
      {scaledImage && (
        <div style={{ position: "relative" }}>
          <ReactCrop
            src={scaledImage}
            crop={crop}
            onChange={(newCrop) => setCrop(newCrop)}
            minWidth={MIN_DIMENSION}
            minHeight={MIN_HEIGHT}
            keepSelection
            circularCrop={false}
            locked={true}
            aspect={aspectRatio}
          >
            <img
              src={scaledImage}
              alt="upload"
              style={{
                maxWidth: "100%",
                objectFit: "contain",
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>

          <div
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              width: "20px",
              height: "20px",
              backgroundImage: `url()`,
              backgroundSize: "cover",
              cursor: "se-resize",
            }}
            onMouseDown={startResize}
          />
        </div>
      )}
      {crop && <button onClick={getCroppedImage}> Confirm </button>}
      {croppedImageUrl && (
        <div>
          <img
            src={croppedImageUrl}
            alt="Cropped"
            style={{ maxWidth: "100%" }}
          />
          <button onClick={uploadCroppedImage} disabled={loading}>
            {loading ? "Uploading..." : "Upload Cropped Image to Firebase"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;
