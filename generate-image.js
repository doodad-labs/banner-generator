const { createCanvas, loadImage, registerFont } = require('canvas');
const languageColours = require('./language-colours.json');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');

registerFont('UbuntuMono.ttf', { family: 'Ubuntu Mono', weight: 'normal', style: 'normal' });

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const WIDTH = 1640;
let HEIGHT = 664;
const MAX_NAME_LENGTH = 26;

async function svgToPng(svgPathOrUrl) {
    let svgData;
    if (svgPathOrUrl.startsWith('http')) {
        const response = await axios.get(svgPathOrUrl, { responseType: 'arraybuffer' });
        svgData = response.data;
    } else {
        svgData = fs.readFileSync(svgPathOrUrl);
    }
    return sharp(svgData).png().toBuffer();
}

function formatNumber(num) {
    if (num >= 1000) {
        const thousands = Math.round(num / 100) / 10;
        return thousands.toString().replace('.0', '') + 'k';
    }
    return num.toString();
}

async function fetchRepos() {
    const response = await axios.get(`https://api.github.com/users/${GITHUB_USERNAME}/repos`);
    return response.data
        .map(repo => ( {
            name: repo.name,
            language: repo.language,
            stars: repo.stargazers_count,
            watchers: repo.watchers_count,
            forks: repo.forks_count,
            issues: repo.open_issues,
            ranking: repo.stargazers_count * 4 + repo.watchers_count * 3 + repo.forks_count * 2 + repo.open_issues
        }))
        .sort((a, b) => b.ranking - a.ranking)
        .filter(repo => !repo.name.startsWith("."));
}

async function loadImages() {
    const [starPngBuffer, logo] = await Promise.all([
        svgToPng('star.svg'),
        loadImage('logo.png')
    ]);
    return {
        star: await loadImage(starPngBuffer),
        logo
    };
}

function drawRepo(ctx, repo, x, y, star) {
    ctx.beginPath();
    ctx.arc(x, y - 13, 15, 0, 2 * Math.PI);
    ctx.fillStyle = languageColours[repo.language] || '#6e6e6e';
    ctx.fill();

    ctx.fillStyle = '#000';
    const name = `${repo.name.substring(0, MAX_NAME_LENGTH)}${repo.name.length > MAX_NAME_LENGTH ? '...' : ''}`;
    ctx.fillText(name, x + 40, y);

    ctx.drawImage(star, x + 40 + (name.length * 20) + 20, y - 35, 40, 40);
    ctx.fillText(formatNumber(repo.stars), x + 40 + (name.length * 20) + 70, y);
}

async function generateImage() {
    const repos = await fetchRepos();
    console.log(`Fetched ${repos.length} repos`);
    HEIGHT += ((repos.length * 85) / 2) + 40;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const { star, logo } = await loadImages();

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(logo, 0, 0, WIDTH, 664);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 664, WIDTH, 2);
    ctx.font = '40px "Ubuntu Mono"';

    let y = 664 + 90;
    repos.forEach((repo, index) => {
        const onRight = index % 2 !== 0;
        const x = 20 + (onRight ? WIDTH / 2 : 0);
        drawRepo(ctx, repo, x, y, star);
        if (onRight) y += 80;
    });

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('banner.png', buffer);
    console.log('Image generated: banner.png');
}

generateImage().catch(console.error);