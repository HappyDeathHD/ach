const form = document.getElementById('achForm');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const downloadLink = document.getElementById('downloadLink');

const CANVAS_WIDTH = 3173;
const CANVAS_HEIGHT = 885;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const IMG_OFFSET_X = 220;
const IMG_OFFSET_Y = 115;
const IMG_SIZE = 660;

const TITLE_CENTER_X = 1700;
const TITLE_Y = 110;

const DESC_AREA_X = IMG_OFFSET_X + IMG_SIZE + 40;
const DESC_AREA_Y = IMG_OFFSET_Y + TITLE_Y + 100;
const DESC_MAX_X = 2600;
const DESC_MAX_Y = 760;
const DESC_AREA_WIDTH = DESC_MAX_X - DESC_AREA_X;
const DESC_AREA_HEIGHT = DESC_MAX_Y - DESC_AREA_Y;

const DATE_X = 2710;
const DATE_Y = 77;

const today = new Date().toISOString().split('T')[0];
document.getElementById('date').value = today;

function waitFontLoaded() {
    return document.fonts.load('40px UnquietSpirit');
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function drawTextOutlined(text, x, y, fontSize, align, baseline) {
    const font = `${fontSize}px "UnquietSpirit", serif`;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y);
}

function drawBlurredImage(img, x, y, size) {
    const tempCanvas = document.createElement('canvas');
    const tctx = tempCanvas.getContext('2d');
    tempCanvas.width = size;
    tempCanvas.height = size;

    tctx.clearRect(0, 0, size, size);
    tctx.save();
    tctx.beginPath();
    tctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    tctx.closePath();
    tctx.clip();

    const cropSize = Math.min(img.width, img.height);
    tctx.drawImage(
        img,
        (img.width - cropSize) / 2,
        (img.height - cropSize) / 2,
        cropSize,
        cropSize,
        0,
        0,
        size,
        size
    );
    tctx.restore();

    ctx.save();
    ctx.filter = 'blur(6px)';
    ctx.drawImage(tempCanvas, x - 6, y - 6, size + 12, size + 12);
    ctx.restore();

    ctx.drawImage(tempCanvas, x + 8, y + 8, size - 16, size - 16);
}

function getFittedFontSize(textLines, maxWidth, maxHeight, maxFontSize, minFontSize) {
    let fontSize = maxFontSize;
    while (fontSize > minFontSize) {
        ctx.font = `${fontSize}px "UnquietSpirit", serif`;
        const lineHeight = fontSize * 1.2;
        let fits = true;

        if (textLines.length * lineHeight > maxHeight) {
            fits = false;
        } else {
            for (const line of textLines) {
                const width = ctx.measureText(line).width;
                if (width > maxWidth) {
                    fits = false;
                    break;
                }
            }
        }

        if (fits) break;
        fontSize -= 1;
    }
    return fontSize;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const to = document.getElementById('to').value;
    const dateRaw = document.getElementById('date').value;
    const title = document.getElementById('title').value;
    const descRaw = document.getElementById('desc').value;
    const imageFile = document.getElementById('image').files[0];

    if (!imageFile) {
        alert('Выберите картинку!');
        return;
    }

    const date = formatDateDDMMYYYY(dateRaw);

    await waitFontLoaded();

	const bgImg = new Image();
	bgImg.src = 'ach.png';
	await new Promise(resolve => bgImg.onload = resolve);

    const userImg = new Image();
    const imgUrl = URL.createObjectURL(imageFile);
    userImg.src = imgUrl;
    await new Promise(resolve => userImg.onload = resolve);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawBlurredImage(userImg, IMG_OFFSET_X, IMG_OFFSET_Y, IMG_SIZE);

    const TITLE_MAX_FONT = 200;
    const TITLE_MIN_FONT = 120;
    const titleMaxWidth = CANVAS_WIDTH * 0.8;
    let titleFontSize = TITLE_MAX_FONT;
    while (titleFontSize > TITLE_MIN_FONT) {
        ctx.font = `${titleFontSize}px "UnquietSpirit", serif`;
        const width = ctx.measureText(title).width;
        if (width <= titleMaxWidth) break;
        titleFontSize -= 1;
    }
    drawTextOutlined(
        title,
        TITLE_CENTER_X,
        TITLE_Y,
        titleFontSize,
        'center',
        'top'
    );

    const descLines = descRaw.split('\n');
    const DESC_MAX_FONT = 120;
    const DESC_MIN_FONT = 60;
    const descFontSize = getFittedFontSize(
        descLines,
        DESC_AREA_WIDTH,
        DESC_AREA_HEIGHT,
        DESC_MAX_FONT,
        DESC_MIN_FONT
    );
    const lineHeight = descFontSize * 1.2;
    let y = DESC_AREA_Y;
    for (const line of descLines) {
        if (y + lineHeight > DESC_MAX_Y) break;
        drawTextOutlined(
            line,
            DESC_AREA_X,
            y,
            descFontSize,
            'left',
            'top'
        );
        y += lineHeight;
    }

    const toFontSize = 100;
    drawTextOutlined(
        `${to}`,
        DESC_MAX_X - 120,
        DESC_MAX_Y - 40,
        toFontSize,
        'right',
        'bottom'
    );

    const dateFontSize = 80;
	ctx.save();
	ctx.translate(DATE_X, DATE_Y);
	ctx.rotate(Math.PI / 2);
	drawTextOutlined(
		date,
		10,
		-260,
		dateFontSize,
		'left',
		'top'
	);
	ctx.restore();

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = `ach_${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        downloadLink.style.display = 'block';
        downloadLink.textContent = `📥 Скачать ${title}.png`;
    });

    URL.revokeObjectURL(imgUrl);
});
