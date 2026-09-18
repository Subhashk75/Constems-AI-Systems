import { Router } from 'express';
import { uploadCsv } from '../middleware/upload.js';
import {
  uploadDataset,
  getDatasets,
  getDatasetById,
  getDatasetRecords,
  getDatasetStats,
  deleteDataset,
} from '../controllers/datasetController.js';

const router = Router();

router.post('/upload', uploadCsv.single('file'), uploadDataset);
router.get('/', getDatasets);
router.get('/:datasetId', getDatasetById);
router.get('/:datasetId/records', getDatasetRecords);
router.post('/:datasetId/records', getDatasetRecords); // Support POST for complex filter payloads
router.get('/:datasetId/stats', getDatasetStats);
router.delete('/:datasetId', deleteDataset);

export default router;
