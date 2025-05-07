import fs from 'fs'
import path from 'path'
import PluginSojsonV7 from '../src/plugin/sojsonv7.js'

// 配置参数
const config = {
    srcDir: './input',
    destDir: './output',
    extensions: ['.html'],
    contentReg: /var\s+\w+\s*=\s*'jsjiami\.com\.v7';[\s\S]*?var\s+version_\s*=\s*'jsjiami\.com\.v7';/
}

// 提取标签间内容
function extractTagContent(content, key) {
    const match = config.contentReg.exec(content)

    if (!match) {
        // console.warn('未检测到混肴代码', key)
        return null
    }

    return match[0]
}

// 遍历目录处理文件
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        if (stats.isDirectory()) {
            processDirectory(filePath)
        } else if (stats.isFile()) {
            processFile(filePath)
        }
    }
}

// 处理单个文件
function processFile(filePath) {
    const ext = path.extname(filePath)

    if (!config.extensions.includes(ext)) return

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8')

    // 截取标签内容
    const processed = extractTagContent(content, filePath)
    if (!processed) return

    // 使用插件处理
    const result = PluginSojsonV7(processed)

    // 保持目录结构写入
    const relativePath = path.relative(config.srcDir, filePath)
    const destPath = path.join(config.destDir, relativePath)

    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    fs.writeFileSync(destPath + '.js', result)
    console.log('已处理文件：', filePath)
}

// 主程序
function main() {
    if (!fs.existsSync(config.srcDir)) {
        throw new Error('源目录不存在')
    }

    processDirectory(config.srcDir)
    console.log('处理完成！结果已保存至', config.destDir)
}

// 命令行参数
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
        case '--src':
            config.srcDir = args[i + 1]
            break
        case '--dest':
            config.destDir = args[i + 1]
            break
        case '--ext':
            config.extensions = args[i + 1].split(',')
            break
        default:
            console.warn('未知参数：', args[i])
    }

}

main()