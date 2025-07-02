const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const axios = require('axios');
const { parse } = require('path');

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
    };
}

async function generateImage() {

    const repos = await fetchRepos();
    console.log(`Fetched ${repos.length} repos`);

    console.log(JSON.stringify(repos))

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const { template } = await loadImages();

    ctx.drawImage(template, 0, 0, WIDTH, HEIGHT);

    const repoCount = repos.length;
    const starCount = repos.reduce((sum, repo) => sum + repo.stars, 0);
    const forkCount = repos.reduce((sum, repo) => sum + repo.forks, 0);
    const issueCount = repos.reduce((sum, repo) => sum + repo.issues, 0);

    console.log({
        repoCount,
        starCount,
        forkCount,
        issueCount
    })

    const formatted = [
        repoCount.toLocaleString('en-gb'),
        ' repos, ',
        starCount.toLocaleString('en-gb'),
        ' stars, ',
        forkCount.toLocaleString('en-gb'),
        ' forks, ',
        issueCount.toLocaleString('en-gb'),
        ' issues'
    ];
    
    ctx.fillStyle = 'black';
    ctx.fillStyle = 'black';

    // Display the text {number} {label}, {number} {label}, ...
    let x = 340;
    formatted.forEach((text, index) => {

        ctx.font = index % 2 === 0 ? '15.5px Space Mono Bold' : '15.5px Space Mono';
        ctx.fillText(text, x, 108);
        x += text.length * 9;
    });

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`banner.png`, buffer);
    console.log('Image generated: banner.png');
}

generateImage().catch(console.error);