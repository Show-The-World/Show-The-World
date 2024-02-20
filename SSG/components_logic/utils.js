const path = require('path');
const fs = require('fs');



const TemplateComponentsPATH = path.join(__dirname, '../template_components')
exports.TemplateComponentsPATH = TemplateComponentsPATH

const SrcPATH = path.join(__dirname, '/src/')
exports.SrcPATH = SrcPATH

const PublicComponentsPATH = path.join(SrcPATH, '/_includes/components/markup')
exports.PublicComponentsPATH = PublicComponentsPATH

const PublicStylesPATH = path.join(SrcPATH, '/_includes/components/styles')
exports.PublicStylesPATH = PublicStylesPATH

const ContentMapPATH = path.join(SrcPATH, '/_includes/components/content_map')
exports.ContentMapPATH = ContentMapPATH



exports.writeToProcessedComponents = function(dir, filename, content=''){
    fs.writeFileSync(path.join(PublicComponentsPATH, dir, filename), content)
}



exports.newComponentDir = function(dir){
    fs.mkdirSync(path.join(PublicComponentsPATH, dir))
}


// Empties the components dir in public for build
const emptyComponentsDir = function(relativePath=PublicComponentsPATH){
    
    const files = fs.readdirSync(relativePath);

    for (const file of files) {
        const filePath = path.join(relativePath, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            emptyComponentsDir(path.join(relativePath, file)); // Recursively empty subdirectories
            fs.rmdirSync(filePath); // Remove the now-empty subdirectory
        } else {
            fs.unlinkSync(filePath); // Delete file
        }
    }
}
exports.emptyComponentsDir = emptyComponentsDir



// Gets all of the compontent files and returns them in a json file as file name/ file content pairs
exports.getTemplateStrings = function(){
    
    // Gets component file names
    const files = fs.readdirSync(TemplateComponentsPATH)

    // data to insert filename/file pairs to.
    const templateData = {}

    
    // For each component category
    files.forEach(dirName=>{
        templateData[dirName] = {}

        // For each component type file
        const componentFiles = fs.readdirSync(path.join(TemplateComponentsPATH, dirName))
        componentFiles.forEach(componentType =>{

            // Get file text and add it to object
            templateData[dirName][componentType] = fs.readFileSync(path.join(TemplateComponentsPATH, dirName, componentType), "utf-8")
        })
    })

    return templateData
}







// Empties the style dir in public for build
const emptyStylesDir = function(relativePath=PublicStylesPATH){
    
    const files = fs.readdirSync(relativePath);

    for (const file of files) {
        const filePath = path.join(relativePath, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            emptyStylesDir(path.join(relativePath, file)); // Recursively empty subdirectories
            fs.rmdirSync(filePath); // Remove the now-empty subdirectory
        } else {
            fs.unlinkSync(filePath); // Delete file
        }
    }
}
exports.emptyStylesDir = emptyStylesDir



// Writes to the style dir for passthrough
exports.writeToStyles = function(dir, filename, content=''){
    fs.writeFileSync(path.join(PublicStylesPATH, dir, filename), content)
}



exports.getStyleGroup = function(templateLocation){
    templateLocation = path.join(TemplateComponentsPATH, templateLocation)

    return fs.readFileSync(templateLocation, 'utf-8')
}



const emptyContentMapDir = function(relativePath=ContentMapPATH){
    
    const files = fs.readdirSync(relativePath);

    for (const file of files) {
        const filePath = path.join(relativePath, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            emptyContentMapDir(path.join(relativePath, file)); // Recursively empty subdirectories
            fs.rmdirSync(filePath); // Remove the now-empty subdirectory
        } else {
            fs.unlinkSync(filePath); // Delete file
        }
    }
}
exports.emptyContentMapDir = emptyContentMapDir

exports.makeComponentTypeContentMap = function(componentName, subComponents){
    const componentMapDir = path.join(ContentMapPATH, componentName)
    fs.mkdirSync(componentMapDir)

    Object.values(subComponents).forEach(component=>{
        fs.writeFileSync(path.join(componentMapDir, component.name + ".json"), JSON.stringify(component.content, null, 4))
    })
}