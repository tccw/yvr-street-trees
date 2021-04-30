import * as React from 'react'
import { heightStringFromID, titleCase } from '../utils'


export const TreeInfoContainer = (props) => {

    const {genus_name, species_name, common_name, tree_id, diameter, civic_number, on_street, height_range_id, color} = props;

    return (
        <div className="treeInfoContainer">
            <h2>{titleCase(common_name)}
                <span className='dot' style={{'--color': color}}></span>
            </h2>
            <h3>{`${titleCase(genus_name)} ${species_name.toLowerCase()}`}</h3>
                <ul>
                    <li>
                        <span>Tree ID</span>
                        <span>{tree_id}</span>
                    </li>
                    <li>
                        <span>Approximate Height</span>
                        <span>{heightStringFromID(height_range_id)}</span>
                    </li>
                    <li>
                        <span>Diameter</span>
                        <span>{`${diameter} inches`}</span>
                    </li>
                    <li>
                        <span>Address</span>
                        <span>{`${civic_number} ${on_street}`}</span>
                    </li>
                </ul>
        </div>    
    ); 

}