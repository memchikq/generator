const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const path = require("path")
const axios = require("axios")
const handlebars = require("express-handlebars")
const { ImgurClient } = require('imgur');
const app = express()
const dotenv = require('dotenv');
dotenv.config();
const port = 3000

const client = new ImgurClient({ clientId: process.env.CLIENT_ID,clientSecret:process.env.CLIENT_SECRET });

app.engine("handlebars", handlebars.engine({ defaultLayout: "index" }))
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "handlebars")
app.use(express.urlencoded({ extended: true }))

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


app.get("/", (req, res) => {
  res.render("main.handlebars", { imageUrl: null })
})


app.post("/generate", upload.single("image"), async (req, res) => {
  try {
   
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
        left:100,
        
      }
    ]).toBuffer();

    const response = await client.upload({
      image:compositeResult,
      type:"stream",
      title:title,
      description:description
    })

    res.render("main.handlebars", { id:response.data.id,imageUrl: response.data.link })
  } catch (error) {
    console.error(error)
    res.status(500).send("Ошибка при генерации изображения.")
  }
})

app.get("/download/:fileName", async (req, res) => {
  const { fileName } = req.params
  
  const response = await axios.get(`https://i.imgur.com/${fileName}.png`, { responseType: 'stream' });
  
  res.setHeader('Content-Type', response.headers['content-type']);
  res.setHeader('Content-Disposition', `attachment; filename="imgur_image.jpg"`);

  response.data.pipe(res)
})

app.listen(port, () => {
  console.log(`Сервер запущен, порт - ${port}`)
})
