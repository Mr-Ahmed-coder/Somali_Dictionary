import { commitWordImport, previewWordImport } from "../services/import.service.js";

export async function previewImport(req, res) {
  const result = await previewWordImport(req.file);
  return res.json(result);
}

export async function commitImport(req, res) {
  const result = await commitWordImport(req.body.rows);
  return res.status(201).json(result);
}
