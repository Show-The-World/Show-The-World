const jsdom = require('jsdom');
const css = require('css');
const utils = require('./utils.js');


const templateStrings = utils.getTemplateStrings()





function hasAttributeValue(element, attribute, value){
    return element.getAttribute(attribute)?.split(' ').includes(value)
}


function getContentID(contentMap, contentObj){
    let count = 1
    Object.values(contentMap).forEach(content =>{
        if(content instanceof contentObj.constructor) count +=1
    })
    
    return count
}





class Component{
    typeOfComponent = "general"
    content
    constructor(componentElem){
        // adds info to this object
        this.componentElem = componentElem
        this.name = componentElem.getAttribute('data-name')
        if(this.name) componentElem.classList.add(this.name)
        this.styleElem = componentElem.querySelector('style')


        // Renders the component's raw style
        if(this.styleElem){
            this.rawCSS = (()=>{
                const stlyeCSS = css.parse(this.styleElem.textContent)
    
                // recurses through css obj and replaces subject selector too it's class referencing name
                const replaceSelectorRecurse = (rule) => {
                    if(rule.selectors){
                        rule.selectors[0] = rule.selectors[0].replaceAll('__subject', '.'+ this.name)
                    } 
                    if(rule.rules){
                        rule.rules.forEach(replaceSelectorRecurse)
                    }
                }
                stlyeCSS.stylesheet.rules.forEach(replaceSelectorRecurse)
                
                
                return css.stringify(stlyeCSS, {})
            })()
        }
        


        // removes all markup info and unneeded details
        componentElem.removeAttribute("data-name")
        if(this.styleElem) this.styleElem.remove()
        

        // List of default implicit element component assignments
        const defHeadingElems = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        const defLabelElems = ['label', 'button', 'a', 'buttoncomp']
        const defTextElems = ['p']
        const defButtonElem = ['button', 'a']

        const contentMap = {}

        const processElements = (element=this.componentElem) => {
            // Defines the tag for future use
            let elementTagName
            if(element.tagName) elementTagName = element.tagName.toLowerCase()


            Array.from(element.childNodes).forEach(childNode =>{
                // Defines tag for future use
                let childTagName
                if(childNode.tagName) childTagName = childNode.tagName.toLowerCase()

                let processChild = true

                if(childNode.nodeName !== '#text'){
                    
                    // checks for button content
                    if(defButtonElem.includes(childTagName)){

                        const contentMapObj = new ButtonComponent(childNode.cloneNode(true))
                        // Adds id to content obj
                        const countID = getContentID(contentMap, contentMapObj)
                        contentMapObj.ID = "buttonComponent-" + countID


                        if(Object.keys(contentMapObj.content).length > 0){
                            contentMap[contentMapObj.ID] = contentMapObj

                            childNode.insertAdjacentHTML('beforebegin',`
                        {% block ${contentMapObj.ID.replace('-', '_')} %}
                            {% set content = content["${contentMapObj.ID}"].content %}
                            ${contentMapObj.html}
                        {% endblock %}\n`)
                            childNode.remove()
                        }

                        delete contentMapObj.html
                        delete contentMapObj.componentElem
                        delete contentMapObj.name
                        delete contentMapObj.styleElem

                        processChild = false
                    }


                    // If qualifies as image content (element is img)...
                    else if(childTagName === 'img'){

                        // Makes the content map
                        const contentMapObj = new ImageContent(childNode)

                        // Adds id to content obj
                        const countID = getContentID(contentMap, contentMapObj)
                        contentMapObj.ID = "image-" +countID

                        // Modifies the element for content mapping
                        childNode.setAttribute('src', `{{ content['${contentMapObj.ID}'].src }}`)
                        childNode.setAttribute('alt', `{{ content['${contentMapObj.ID}'].alt }}`)

                        // Adds to the contentMap
                        contentMap[contentMapObj.ID] = contentMapObj
                        processChild = false
                    }
                    
        
                    // If the node is a component reference ...
                    if(childTagName === 'component'){


                        // If the component is not set to be variable and content decided (under the specified component type of course), identify it as so
                        if(hasAttributeValue(childNode, 'content-remove', 'component')){
                            const contentMapObj = COMPONENTS[childNode.getAttribute('component-type')][childNode.getAttribute('component-name')]

                            // Adds id to content obj
                            const countID = getContentID(contentMap, contentMapObj)
                            contentMapObj.ID = contentMapObj.typeOfComponent + "Component-" +countID

                            contentMap[contentMapObj.ID] = contentMapObj
                            
                            childNode.replaceWith(`
        {% block ${contentMapObj.ID.replace('-', '_')} %}
            {% set content = content["${contentMapObj.ID}"].content %}
            {% include "components/${contentMapObj.typeOfComponent}/${contentMapObj.name}.njk" %}
        {% endblock %}\n`)
                        }
                        else{
                            const contentMapObj =  new ComponentContent(childNode)
                            
                            const countID = getContentID(contentMap, contentMapObj)
                            contentMapObj.ID = "component-" +countID

                            contentMap[contentMapObj.ID] = contentMapObj

                            childNode.replaceWith(`
        {% block ${contentMapObj.ID.replace('-', '_')} %}
            {% set componentName = "components/${childNode.getAttribute("component-type")}/" + content["${contentMapObj.ID}"].name + ".njk" %}
            {% set content = content["${contentMapObj.ID}"].content %}
            {% include componentName %}
        {% endblock %}\n`)
                        }   

                        processChild = false
                    }

                    // Cleans up elements of any content attributes
                    childNode.removeAttribute('content-remove')
                    childNode.removeAttribute('content-add')
                }
                // If the node is a text node and does not only contain whitespace...
                else if(!/^\s*$/.test(childNode.textContent)){

                    // If qualifies as label content (element is a label element or has content-add="label" on parent, as long as does not have content-remove="label" on parent)...
                    if((defLabelElems.includes(elementTagName) || hasAttributeValue(element, 'content-add', 'label')) && !hasAttributeValue(element, 'content-remove', 'label')){
                        // Makes the content map
                        const contentMapObj = new LabelContent(childNode)

                        // Adds id to content obj
                        const countID = getContentID(contentMap, contentMapObj)
                        contentMapObj.ID = "label-" +countID
                        // Modifies the element for content mapping
                        childNode.replaceWith(`{{ content["label-${countID}"].text }}`)

                        // Adds to the contentMap
                        contentMap[contentMapObj.ID] = contentMapObj
                    }

                    else if((defHeadingElems.includes(elementTagName) || hasAttributeValue(element, 'content-add', 'heading')) && !hasAttributeValue(element, 'content-remove', 'heading')){
                        // Makes the content map
                        const contentMapObj = new HeadingContent(childNode)

                        // Adds id to content obj
                        const countID = getContentID(contentMap, contentMapObj)
                        contentMapObj.ID = "heading-" +countID
                        // Modifies the element for content mapping
                        childNode.replaceWith(`{{ content["heading-${countID}"].text }}`)

                        // Adds to the contentMap
                        contentMap[contentMapObj.ID] = contentMapObj
                    }

                    // If qualifies as text content (same as label)...
                    else if((defTextElems.includes(elementTagName) || hasAttributeValue(element, 'content-add', 'text') && !hasAttributeValue(element, 'content-remove', 'text'))){
                        // Makes the content map
                        const contentMapObj = new TextContent(childNode)

                        // Adds id to content obj
                        const countID = getContentID(contentMap, contentMapObj)
                        contentMapObj.ID = "text-" +countID
                        // Modifies the element for content mapping
                        childNode.replaceWith(`{{ content["text-${countID}"].text }}`)

                        // Adds to the contentMap
                        contentMap[contentMapObj.ID] = contentMapObj
                    }

                    processChild = false
                }

                if(processChild) processElements(childNode)
            })
            
            // Cleans up elements of any content attributes
            if(element.nodeName !== '#text'){
                element.removeAttribute('content-remove')
                element.removeAttribute('content-add')
            }
        }

        processElements()

        this.content = contentMap
        this.html = this.componentElem.outerHTML
    }
}



class LayoutComponent extends Component{
    typeOfComponent = 'layout'
    constructor(componentElem){
        super(componentElem)

        this.html = this.html.replaceAll((this.typeOfComponent+"comp").toLocaleLowerCase(), `{{ content.tag | default("div", true) }}`)
    }
}


class ButtonComponent extends Component{
    typeOfComponent = 'button'
    constructor(componentElem){
        const beforeModsComponent = componentElem.cloneNode(true)
        super(componentElem)

        if(!hasAttributeValue(beforeModsComponent, "content-remove", "button")){
            this.content.button = new ButtonContent(componentElem)
        }
        
        const elemTag = beforeModsComponent.tagName

        this.html = this.html.replace((this.typeOfComponent+"comp").toLocaleLowerCase(), (this.typeOfComponent+"comp").toLocaleLowerCase() + ` {{ "href=" + content.button.href if content.button.aTagORbuttonTag == "a" }}`)
        this.html = this.html.replaceAll((this.typeOfComponent+"comp").toLocaleLowerCase(), `{{ content.button.aTagORbuttonTag | default("a", true) }}`)
    }
}





// Each content type has its own value object and a default key (used if there is only one key value pair) for easy use

class Content{
    constructor(componentElem){
    }
    
    setValue(value, key){
        this[key] = value
    }
}



// Basic elemental contents
class LabelContent extends Content{
    constructor(componentElem){
        super(componentElem)

        this.setValue(componentElem.textContent, 'text')
    }
}


class HeadingContent extends Content{
    constructor(componentElem){
        super(componentElem)

        this.setValue(componentElem.textContent, 'text')
    }
}

class TextContent extends Content{
    constructor(componentElem){
        super(componentElem)
        
        this.setValue(componentElem.textContent, 'text')
    }
}

class ImageContent extends Content{
    constructor(componentElem){
        super(componentElem)

        this.setValue(componentElem.getAttribute('src'), 'src')
        this.setValue(componentElem.getAttribute('alt'), 'alt')
    }
}


// allows choice of specific component under category "type" and contains component reference to chosen component 
class ComponentContent extends Content{
    constructor(componentElem){
        super(componentElem)
        const typeOfComponent = componentElem.getAttribute('component-type')
        
        this.setValue(componentElem.getAttribute('component-name'), 'name')
        this.content = COMPONENTS[typeOfComponent][this.name].content
    }
}




// Contains parameter content for each button component
class ButtonContent extends Content {
    constructor(buttonElement){
        super(buttonElement)

        this.setValue(buttonElement.getAttribute('href'), 'href')
        this.setValue(buttonElement.getAttribute('id'), 'id')
        this.setValue(buttonElement.tagName.toLowerCase(), 'aTagORbuttonTag')
    }
}





const COMPONENTS = {}
exports.COMPONENTS = COMPONENTS

const processComponents = function(){
    
    COMPONENTS.button = {}
    const buttonDOM = new jsdom.JSDOM(templateStrings.markup['buttons.html'])
    const buttonDocument = buttonDOM.window.document
    const buttonElements = buttonDocument.querySelectorAll('buttonCOMP')
    buttonElements.forEach(button => {
        COMPONENTS.button[button.getAttribute('data-name')] = new ButtonComponent(button)
    })
    
    
    
    // Layout Formatting
    COMPONENTS.layout = {}
    const layoutDOM = new jsdom.JSDOM(templateStrings.markup['layouts.html'])
    const layoutDocument = layoutDOM.window.document
    const layoutElements = layoutDocument.querySelectorAll('layoutCOMP')
    layoutElements.forEach(layout => {
        COMPONENTS.layout[layout.getAttribute('data-name')] = new LayoutComponent(layout)
    })


    

    return COMPONENTS
}
exports.processComponents = processComponents