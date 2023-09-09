const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const handlebars = require("express-handlebars")
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, "public")))
app.engine("handlebars", handlebars.engine({ defaultLayout: "index" }))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "handlebars")
app.use(express.urlencoded({ extended: true }))

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Главная страница
app.get("/", (req, res) => {
  res.render("main.handlebars", { imageUrl: null })
})

// Обработка отправки формы
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    // Извлечение данных из формы
    const { title, description } = req.body
    const imageBuffer = req.file.buffer

    // Создание Jimp объекта из загруженного изображения
    const sharpImage = sharp(imageBuffer)
    const svgImage = `
    <svg width="400" height="483">
      <style>
      .title { fill: red; font-size: 70px; font-weight: bold;}
      </style>
      <text x="50%" y="20%" text-anchor="middle" class="title">${title}</text>
      <text x="50%" y="50%" text-anchor="middle" class="title">${description}</text>
    </svg>
    `;
    const compositeResult = await sharpImage.composite([
      {
        input: Buffer.from(svgImage),
        top: 0,
        left:0,
        
      }
    ]).toBuffer();

    const fileName = `generated-${Date.now()}.png`

    const outputPath = path.join(__dirname, "public", fileName)

    await sharp(compositeResult).toFile(outputPath)

    res.render("main.handlebars", { imageUrl: `/download/${fileName}` })
  } catch (error) {
    console.error(error)
    res.status(500).send("Ошибка при генерации изображения.")
  }
})

app.get("/download/:fileName", (req, res) => {
  const { fileName } = req.params
  const filePath = path.join(__dirname, "public", fileName)
  res.download(filePath)
})

app.listen(port, () => {
  console.log(`Сервер запущен, порт - ${port}`)
})
