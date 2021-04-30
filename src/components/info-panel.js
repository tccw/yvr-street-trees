import * as React from 'react'
import { useState } from 'react'
// import * as componentStyles from '../cssmodules/infopanel.module.css'

function InfoPanel(props) {
    const [isExpanded, setIsExpanded] = useState(true); 

    const handleToggle = () => {
        if (isExpanded) {
            setIsExpanded(false);
        } else {
            setIsExpanded(true);
        }
    };

    return (
        <>
            <div className={isExpanded ? "infopanel" : "infopanel-collapsed"}>
                <button onClick={handleToggle}>Toggle</button>
                <h1>{props.title}</h1>
            </div>
            {! isExpanded && 
                <button className="collapsedtoggle" onClick={handleToggle}>Toggle</button>
            }
            <div>
                {props.children}
            </div>
            
        </>
    )
}

export default InfoPanel;