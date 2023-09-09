const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const path = require('path');
const handlebars  = require('express-handlebars');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname,"public")));
app.engine(
    'handlebars',
    handlebars.engine({ defaultLayout: 'index'})
);
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'handlebars');
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Главная страница
app.get('/', (req, res) => {
  res.render('main.handlebars',{ imageUrl: null });
});

// Обработка отправки формы
app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    // Извлечение данных из формы
    const { title, description } = req.body;
    const imageBuffer = req.file.buffer;

    // Создание Jimp объекта из загруженного изображения
    const image = await Jimp.read(imageBuffer);


    // Добавление текста на изображение
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    image.print(font, 0, 0, {
      text: title,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, image.bitmap.width, image.bitmap.height);
    image.print(font, 0, 0, {
        text: description,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, image.bitmap.width, image.bitmap.height);


      const fileName = `generated-${Date.now()}.png`;

      // Сохранение сгенерированного изображения
      const outputPath = path.join(__dirname, 'public', fileName);
      await image.writeAsync(outputPath);
  
      // Отправка сгенерированного изображения клиенту
      res.render('main.handlebars', { imageUrl: `/download/${fileName}` });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при генерации изображения.');
  }
});

app.get('/download/:fileName', (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, 'public', fileName);
    res.download(filePath);
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});