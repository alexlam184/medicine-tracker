import React, { useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { v4 as uuidv4 } from "uuid";

const roles = ["Manufacturer", "Distributor", "Pharmacy", "Patient"];

const createBlock = (data, previousHash = "0") => ({
  index: uuidv4(),
  timestamp: new Date().toISOString(),
  data,
  previousHash,
  hash: uuidv4(),
});

export default function App() {
  const medicineNames = ["Paracetamol", "Amoxicillin", "Ibuprofen"];
  const brands = ["Brand A", "Brand B", "Brand C"];
  const factories = ["Factory 1", "Factory 2", "Factory 3"];
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [form, setForm] = useState({
    name: "",
    batch: "",
    brand: "",
    factory: "",
    productionDate: "",
  });
  const fgRef = useRef();

  const addMedicine = (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.batch.trim() ||
      !form.brand.trim() ||
      !form.factory.trim() ||
      !form.productionDate.trim()
    )
      return;

    const genesisBlock = createBlock({
      role: "Manufacturer",
      status: `Created ${form.name} (${form.batch})`,
      medicine: form.name,
      batch: form.batch,
      brand: form.brand,
      factory: form.factory,
      productionDate: form.productionDate,
    });

    const newMed = {
      id: uuidv4(),
      name: form.name.trim(),
      batch: form.batch.trim(),
      brand: form.brand.trim(),
      factory: form.factory.trim(),
      productionDate: form.productionDate,
      blocks: [genesisBlock],
      step: 1,
    };

    setMedicines((ms) => [...ms, newMed]);
    setSelectedMedicineId(newMed.id);
    setForm({
      name: "",
      batch: "",
      brand: "",
      factory: "",
      productionDate: "",
    });
  };

  const nextStep = () => {
    setMedicines((ms) =>
      ms.map((med) => {
        if (med.id !== selectedMedicineId) return med;
        if (med.step >= roles.length) return med;

        const role = roles[med.step];
        const lastBlock = med.blocks[med.blocks.length - 1];

        const newBlock = createBlock(
          {
            role,
            status: `${role} received ${med.name} (${med.batch})`,
            medicine: med.name,
            batch: med.batch,
            brand: med.brand,
            factory: med.factory,
            productionDate: med.productionDate,
          },
          lastBlock.hash
        );

        return {
          ...med,
          blocks: [...med.blocks, newBlock],
          step: med.step + 1,
        };
      })
    );
  };

  const selectedMed = medicines.find((m) => m.id === selectedMedicineId);
  const selectedStatus =
    selectedMed?.blocks[selectedMed.blocks.length - 1]?.data.status ||
    "No medicine selected";

  const nodes = medicines.flatMap((med, i) =>
    med.blocks.map((block, idx) => {
      const x = 50 * idx + 100;
      const y = 40 * i + 100;
      return {
        id: block.hash,
        label: `${block.data.role}\n${med.name} (${
          med.batch
        })\n${block.hash.slice(0, 6)}`,
        medicineName: med.name,
        index: idx + 1,
        x,
        y,
        fx: x,
        fy: y,
      };
    })
  );

  const links = [];
  nodes.forEach((node) => {
    if (!node.id) return;
    const block = medicines
      .flatMap((med) => med.blocks)
      .find((b) => b.hash === node.id);

    if (block && block.previousHash !== "0") {
      const prevNode = nodes.find((n) => n.id === block.previousHash);
      if (prevNode) {
        links.push({ source: block.previousHash, target: block.hash });
      }
    }
  });

  const medicineColors = {};
  medicines.forEach((med, i) => {
    medicineColors[med.name] = [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
    ][i % 5];
  });

  const paintNode = (node, ctx, globalScale) => {
    const lines = node.label.split("\n");
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    ctx.fillStyle = medicineColors[node.medicineName] || "gray";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    lines.forEach((line, i) => {
      ctx.fillText(line, node.x, node.y - 14 - i * fontSize);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Blockchain Medicine Tracking Demo
        </h1>

        <form
          onSubmit={addMedicine}
          className="mb-6 bg-white p-4 rounded shadow"
        >
          <h2 className="text-xl font-semibold mb-3">Create New Medicine</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="p-2 border rounded"
              required
            >
              <option value="">Select Medicine Name</option>
              {medicineNames.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Batch Number"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="p-2 border rounded"
              required
            >
              <option value="">Select brand</option>
              {brands.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select
              value={form.factory}
              onChange={(e) => setForm({ ...form, factory: e.target.value })}
              className="p-2 border rounded"
              required
            >
              <option value="">Select Manufacture Factory</option>
              {factories.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.productionDate}
              onChange={(e) =>
                setForm({ ...form, productionDate: e.target.value })
              }
              className="p-2 border rounded col-span-2"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </form>

        <div className="mb-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">
            Select Medicine to Track
          </h2>
          <select
            className="w-full p-2 border rounded mb-4"
            value={selectedMedicineId}
            onChange={(e) => setSelectedMedicineId(e.target.value)}
          >
            <option value="">-- Select Medicine --</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.batch})
              </option>
            ))}
          </select>
          <p className="mb-4">
            <strong>Status:</strong> {selectedStatus}
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={nextStep}
            disabled={
              !selectedMed ||
              selectedMed.step >= roles.length ||
              !selectedMedicineId
            }
          >
            {selectedMed && selectedMed.step < roles.length
              ? `Send to ${roles[selectedMed.step]}`
              : "Completed or Select Medicine"}
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow max-h-[400px] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-3">Blockchain Ledger</h2>
          {medicines.length === 0 && <p>No medicines created yet.</p>}
          {medicines.map((med) => (
            <div key={med.id} className="mb-6">
              <h3 className="font-semibold mb-2">
                {med.name} ({med.batch})
              </h3>
              <table className="min-w-full border-collapse border border-gray-400 text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-1">#</th>
                    <th className="border px-3 py-1">Timestamp</th>
                    <th className="border px-3 py-1">Role</th>
                    <th className="border px-3 py-1">Status</th>
                    <th className="border px-3 py-1">Brand</th>
                    <th className="border px-3 py-1">Factory</th>
                    <th className="border px-3 py-1">Production Date</th>
                    <th className="border px-3 py-1">Hash</th>
                    <th className="border px-3 py-1">Previous Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {med.blocks.map((block, idx) => (
                    <tr
                      key={block.index}
                      className="odd:bg-white even:bg-gray-50"
                    >
                      <td className="border px-3 py-1">{idx + 1}</td>
                      <td className="border px-3 py-1">{block.timestamp}</td>
                      <td className="border px-3 py-1">{block.data.role}</td>
                      <td className="border px-3 py-1">{block.data.status}</td>
                      <td className="border px-3 py-1">{block.data.brand}</td>
                      <td className="border px-3 py-1">{block.data.factory}</td>
                      <td className="border px-3 py-1">
                        {block.data.productionDate}
                      </td>
                      <td className="border px-3 py-1">{block.hash}</td>
                      <td className="border px-3 py-1">{block.previousHash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="mb-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">Blockchain Graph</h2>
          {nodes.length > 0 ? (
            <ForceGraph2D
              ref={fgRef}
              graphData={{ nodes, links }}
              nodeLabel="label"
              nodeAutoColorBy="medicineName"
              nodeCanvasObject={paintNode}
              enableZoom={false}
              enablePan={false}
              enableNodeDrag={false}
              cooldownTicks={0}
            />
          ) : (
            <p className="text-gray-500">No blocks to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}
