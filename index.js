const fs = require('fs');
const sharp = require('sharp');
const readline = require('readline');

const inputFolder = 'img'; // Dossier contenant les images originales
const outputFolder = 'resize'; // Dossier de sortie pour les images redimensionnées
const maxDimension = 2000; // Taille maximale autorisée pour la largeur et la hauteur

let desiredWidth;
let desiredHeight;
let shouldRename;

const rl = readline.createInterface({
    input: process.stdin, output: process.stdout
});

function askWidth() {
    rl.question('Entrez la largeur souhaitée (en pixels) : ', (width) => {
        const parsedWidth = parseInt(width, 10);

        if (isNaN(parsedWidth) || parsedWidth <= 0 || parsedWidth > maxDimension) {
            console.error(`Veuillez entrer une largeur valide (entier positif et inférieur ou égal à ${maxDimension}).`);
            askWidth(); // Répéter la question en cas de réponse incorrecte
        } else {
            desiredWidth = parsedWidth;
            askHeight(); // Passer à la question suivante
        }
    });
}

function askHeight() {
    rl.question('Entrez la hauteur souhaitée (en pixels) : ', (height) => {
        const parsedHeight = parseInt(height, 10);

        if (isNaN(parsedHeight) || parsedHeight <= 0 || parsedHeight > maxDimension) {
            console.error(`Veuillez entrer une hauteur valide (entier positif et inférieur ou égal à ${maxDimension}).`);
            askHeight(); // Répéter la question en cas de réponse incorrecte
        } else {
            desiredHeight = parsedHeight;
            askRename(); // Passer à la question suivante
        }
    });
}

function askRename() {
    rl.question('Voulez-vous renommer les images avec les dimensions ? (oui/non) : ', (rename) => {
        if (rename.toLowerCase() !== 'oui' && rename.toLowerCase() !== 'non') {
            console.error('Veuillez répondre par "oui" ou "non".');
            askRename(); // Répéter la question en cas de réponse incorrecte
        } else {
            shouldRename = rename.toLowerCase() === 'oui';
            rl.close();
            // Appeler une fonction pour redimensionner et renommer les images avec les réponses de l'utilisateur
            resizeAndRenameImages();
        }
    });
}

function resizeAndRenameImages() {
    // Vérifier si le dossier de sortie existe, sinon le créer
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    // Lister les fichiers du dossier d'entrée
    fs.readdir(inputFolder, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }

        // Filtrer les fichiers pour ne conserver que les fichiers image (par extension)
        const imageFiles = files.filter(file => {
            const lowerCaseFile = file.toLowerCase();
            return (lowerCaseFile.endsWith('.jpg') || lowerCaseFile.endsWith('.jpeg') || lowerCaseFile.endsWith('.png') || lowerCaseFile.endsWith('.gif'));
        });

        // Parcourir chaque fichier image
        imageFiles.forEach(imageFile => {
            const inputImagePath = `${inputFolder}/${imageFile}`;

            sharp(inputImagePath)
                .metadata()
                .then(metadata => {
                    let oldWidth  = metadata.width;
                    let oldHeight = metadata.height;
                    let oldSize = (fs.statSync(inputImagePath).size / 1024).toFixed(2)
                    const imageProcessor = sharp(inputImagePath)
                        .resize(parseInt(desiredWidth, 10), parseInt(desiredHeight, 10));
                    if (shouldRename) {
                        const outputImagePath = `${outputFolder}/${desiredWidth}x${desiredHeight}-${imageFile}`;
                        imageProcessor.toFile(outputImagePath, (err, info) => {
                            let newSize = (fs.statSync(outputImagePath).size / 1024).toFixed(2);
                            let percentChange = (((newSize - oldSize) / oldSize) * 100).toFixed(2);
                            if (err) {
                                console.error(`Erreur lors du traitement de ${inputImagePath}: ${err}`);
                            } else {
                                console.log(`\x1b[37mImage \x1b[31m${inputImagePath} \x1b[37mredimensionnée et renommée en tant que \x1b[32m${outputImagePath}\x1b[37m. (\x1b[31m${oldWidth}x${oldHeight}\x1b[37m -> \x1b[32m${info.width}x${info.height}\x1b[37m)(\x1b[31m${oldSize}kb\x1b[37m -> \x1b[32m${newSize}kb\x1b[37m : ${percentChange >= 0 ? ` \x1b[31m${percentChange}` : `\x1b[32m${percentChange}`}%\x1b[37m)`);
                            }
                        });
                    } else {
                        const outputImagePath = `${outputFolder}/${imageFile}`;
                        imageProcessor.toFile(outputImagePath, (err, info) => {
                            let newSize = (fs.statSync(outputImagePath).size / 1024).toFixed(2);
                            let percentChange = (((newSize - oldSize) / oldSize) * 100).toFixed(2);
                            if (err) {
                                console.error(`Erreur lors du traitement de ${inputImagePath}: ${err}`);
                            } else {
                                 console.log(`\x1b[37mImage \x1b[31m${inputImagePath} \x1b[37mredimensionnée et renommée en tant que \x1b[32m${outputImagePath}\x1b[37m. (\x1b[31m${oldWidth}x${oldHeight}\x1b[37m -> \x1b[32m${info.width}x${info.height}\x1b[37m)(\x1b[31m${oldSize}kb\x1b[37m -> \x1b[32m${newSize}kb\x1b[37m : ${percentChange >= 0 ? ` \x1b[31m${percentChange}` : `\x1b[32m${percentChange}`}%\x1b[37m)`);
                            }
                        });
                    }
                })
                .catch(err => console.error(`Error getting metadata of ${inputImagePath}: ${err}`));

        });
    })
}

askWidth(); // Commencer par poser la question de la largeur