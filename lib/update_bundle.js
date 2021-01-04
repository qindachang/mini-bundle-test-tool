const chalk = require('chalk')
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const ora = require('ora');
const symbols = require('log-symbols');
const del = require('del');
const compressing = require('compressing');

const currentCommandPath = process.cwd()

async function init(opt) {
  const { url } = opt || {}
  if (!url) {
    console.log(`  Run ${chalk.cyan(`bundle-tool sync --help`)} for detailed usage of given command.`)
    return
  }
  try {
    const result = await downloadFile(url, currentCommandPath)
    const fileName = getFileNameFromUrl(url);
    let unCompressFolder
    if (fileName.indexOf('build-weapp') !== -1) {
      const arr = fileName.replace('.zip', '').split('build-weapp');
      unCompressFolder = 'build-weapp' + arr[arr.length - 1];
    } else if (fileName.indexOf('build-alipay') !== -1) {
      const arr = fileName.replace('.zip', '').split('build-alipay');
      unCompressFolder = 'build-weapp' + arr[arr.length - 1];
    } else {
      unCompressFolder = fileName.replace('.zip', '')
    }
    console.log(`开始删除文件夹 ${chalk.cyan(`${currentCommandPath}/${unCompressFolder}`)}`)
    await del(path.resolve(currentCommandPath, unCompressFolder));
    console.log(symbols.success, '删除完成')
    console.log(`开始解压 ${chalk.cyan(`${currentCommandPath}/${fileName}`)}`);
    await compressing.zip.uncompress(path.resolve(currentCommandPath, fileName), currentCommandPath);
    console.log(symbols.success, '解压完成，输出到：', `${chalk.cyan(`${currentCommandPath}/${unCompressFolder}`)}`);
  } catch (e) {

  }
}

function getFileNameFromUrl(url) {
  const arr = url.split('/');
  if (arr.length < 1) {
    return 'temp';
  }
  const fileName = arr[arr.length - 1];
  return fileName;
}

function downloadFile(url, localDir) {
  return new Promise((resolve, reject) => {
    const fileName = getFileNameFromUrl(url);
    const filePath = path.resolve(localDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const out = fs.createWriteStream(filePath);
    const spinner = ora();
    console.log(`开始下载... ${chalk.cyan(`${url}`)}`);
    spinner.start('下载中...');
    let request = http;
    if (url.startsWith('https')) {
      request = https;
    }
    request.get(url, res => {
      res.on('data', chunk => {
        out.write(chunk);
      });
      res.on('end', () => {
        spinner.stop();
        console.log(symbols.success, '下载完成');
        resolve(true);
      });
      res.on('error', () => {
        spinner.stop();
        console.log(symbols.error, chalk.red('下载失败'));
        resolve(false);
      });
    });
  });
}


module.exports = (...args) => {
  return init(...args)
}
