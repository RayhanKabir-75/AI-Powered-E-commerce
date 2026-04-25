import React, { useState } from "react";
import axios from "axios";

const ProductDescription = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!name || !category || !price || !features) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://127.0.0.1:8000/api/ai/generate-description/",
        {
          name,
          category,
          price,
          features,
        }
      );

      console.log(response.data);

      setDescription(response.data.description);
    } catch (error) {
      console.error(error);
      alert("Error generating description");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>AI Product Description Generator</h2>

      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <textarea
        placeholder="Features"
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <button onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate Description"}
      </button>

      {description && (
        <div style={{ marginTop: "20px" }}>
          <h3>Generated Description:</h3>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

export default ProductDescription;