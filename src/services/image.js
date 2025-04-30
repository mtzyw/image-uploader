// src/services/image.service.js

import { db } from '../db/index.js';
import { images } from '../db/schema.js';

export async function saveImageRecord({ id, userId, filename, url }) {
  await db.insert(images).values({
    id,
    userId,
    filename,
    url
  });
}
