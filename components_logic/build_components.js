const buildComponents = require('./process_components.js');
const utils = require('./utils.js');



function buildComponentMarkup(){
    // Makes the component templates
    const COMPONENTS = buildComponents.processComponents()
    utils.emptyComponentsDir()

    // console.log(JSON.stringify(COMPONENTS.layout["--layout-hero"].html))
    

    Object.keys(COMPONENTS).forEach(componentTypeKey => {
        // Creates a directory for each component type
        utils.newComponentDir(componentTypeKey)
        
        // makes a template for each component of component type
        Object.values(COMPONENTS[componentTypeKey]).forEach(subComponent =>{
            utils.writeToProcessedComponents(componentTypeKey, subComponent.name+ ".njk", subComponent.html)
        })
    });

    let componentCSS = ""

    // Makes the styes for each component
    Object.values(COMPONENTS).forEach(componentType=>{
        
        Object.values(componentType).forEach(component=>{
            componentCSS += component.rawCSS
        })
    })
    utils.writeToStyles('/', "components.css", componentCSS)


    utils.emptyContentMapDir()
    Object.keys(COMPONENTS).forEach(componentTypeKey=>{
        utils.makeComponentTypeContentMap(componentTypeKey, COMPONENTS[componentTypeKey])
    })
}
exports.buildComponentMarkup = buildComponentMarkup



function buildMainStyles(){
    // Builds all of the main styles
    // utils.emptyStylesDir()
    const STYLES = {}
    STYLES.general = utils.getStyleGroup('general_styles/general.css')
    STYLES.reset = utils.getStyleGroup('general_styles/reset.css')
    STYLES.colors = utils.getStyleGroup('style_values/colors.css')
    STYLES.sizes = utils.getStyleGroup('style_values/sizes.css')
    STYLES.typography = utils.getStyleGroup('stylistic/typography.css')

    const mainCSS =
`${STYLES.reset}


${STYLES.general}


${STYLES.colors}

${STYLES.sizes}


${STYLES.typography}`

    utils.writeToStyles('/', "main.css", mainCSS)
}
exports.buildMainStyles = buildMainStyles



buildComponentMarkup()
// buildMainStyles()