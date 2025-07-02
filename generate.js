const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment');

registerFont('./fonts/SpaceMono.ttf', { family: 'Space Mono', weight: 'normal', style: 'normal' });
registerFont('./fonts/SpaceMono-Bold.ttf', { family: 'Space Mono Bold', weight: 'bold', style: 'normal' });

const GITHUB_USERNAME = "doodad-labs";
const WIDTH = 1087;
const HEIGHT = 367;

async function fetchRepos() {
    const response = await axios.get(`https://api.github.com/users/${GITHUB_USERNAME}/repos`);
    return response.data.map(repo => ({
        name: repo.name,
        stars: repo.stargazers_count,
        watchers: repo.watchers_count,
        forks: repo.forks_count,
        issues: repo.open_issues
    }))
}

async function loadImages() {
    return {
        template: await loadImage('imgs/template.png'),
        templateDark: await loadImage('imgs/template-dark.png'),
    };
}

async function generateImage(theme = 'light') {

    const repos = await fetchRepos();

    console.log(JSON.stringify(repos))

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const { template, templateDark } = await loadImages();

    ctx.fillStyle = theme === 'light' ? 'black' : 'white';
    ctx.drawImage(theme === 'light' ? template : templateDark, 0, 0, WIDTH, HEIGHT);

    const repoCount = repos.length;
    const starCount = repos.reduce((sum, repo) => sum + repo.stars, 0);
    const forkCount = repos.reduce((sum, repo) => sum + repo.forks, 0);
    const issueCount = repos.reduce((sum, repo) => sum + repo.issues, 0);

    const formatted = [
        repoCount.toLocaleString('en-gb'),
        ` repo${repoCount!==1 ? 's' : ''}, `,
        starCount.toLocaleString('en-gb'),
        ` star${starCount!==1 ? 's' : ''}, `,
        forkCount.toLocaleString('en-gb'),
        ` fork${forkCount!==1 ? 's' : ''}, `,
        issueCount.toLocaleString('en-gb'),
        ` issue${issueCount!==1 ? 's' : ''}`
    ];

    let x = 340;
    formatted.forEach((text, index) => {

        ctx.font = index % 2 === 0 ? '15.5px Space Mono Bold' : '15.5px Space Mono';
        ctx.fillText(text, x, 108);
        x += text.length * 9;
    });

    ctx.font = '10px Space Mono';
    ctx.fillText(`Generated on ${moment().format('MMMM Do YYYY').toLowerCase()}`, WIDTH - 180, HEIGHT - 20);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`banner@${theme === 'light' ? 'light' : 'dark'}.png`, buffer);
    console.log('Image generated: banner.png');
}

generateImage().catch(console.error);
generateImage('dark').catch(console.error);