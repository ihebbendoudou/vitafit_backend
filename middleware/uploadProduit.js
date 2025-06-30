const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/produits/');
  },
 filename: function (req, file, cb) {
  // Supprimer les espaces et caractères spéciaux éventuels dans le nom original
  const nameWithoutSpaces = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
  const uniqueName = Date.now() + '-' + nameWithoutSpaces;
  cb(null, uniqueName);
}
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPG, JPEG, PNG sont autorisés'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
