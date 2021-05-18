import * as React from 'react'
import { heightStringFromID, titleCase, toPrettyDateString} from '../utils'
import styled from 'styled-components'
import { Copy } from '../svg-icons'

// margin order is top right bottom left
const StyledTreeInfo = styled.section`
    position: relative;
    top: 1rem;
    width: inheret;
    backgroud: white;
    margin: 0 20px;
    font-size: 13px;
    line-height: 2;
    color: #6b6b76;
    outline: none;
    display: flex;
    flex-direction: column;
`;

const StyledSubText = styled.span`
    text-align: left;
    color: #63686a;
    margin-left: 20px;
    font-size: ${props => (props.font_size)};
    font-style: ${props => (props.font_style)};
    font-weight: 50;
    text-transform: ${props => (props.text_transform ? props.text_transform : 'none')};
`; 

const TreeDetailsList = styled.ul`
    list-style-type: none
`;

const TreeListElement = styled.li`
    border-bottom: 1px solid lightgrey;
    width: 90%;
    margin-bottom: 1rem;
`;

const TreeDetail = styled.div`
    display: flex;
`;

const TreeDetailKey = styled.span`  
    flex: 1;
    font-weight: bold;
    font-size: 1rem;
    text-align: left;
`;

const TreeDetailValue = styled.span`
    flex: 2;
    font-size: 0.9rem;
    color: darkgreen;   
`;

const CopyButton = styled.button.attrs(props => ({
    alt: 'copy to clipboard',
    title:'copy to clipboard'
}))`
    all: unset;
    display: flex;
    cursor: pointer;
    position: relative;
    border-radius: 50%;
    justify-content: flex-end;
    height: -moz-fit-content;
    height: fit-content;
    width: -moz-fit-content;
    width: fit-content;
    opacity: 0.3;
    vertical-align: middle;

    &:hover {
        opacity: 1;
    }
`;



/**
 * This container should reviece the properties of the selected tree
 * and the treeStats object which is calculated on first render.
 * 
 * @param {any} props 
 * @returns 
 */
const TreeInfoContainer = (props) => {

    const {genus_name, species_name, tree_id, 
           diameter, civic_number, on_street, 
           height_range_id, date_planted, common_name,
           neighbourhood_name, cultivar_name} = props;

    var listValues = {
        'Tree ID' : tree_id,
        'Height' : `${heightStringFromID(height_range_id)}`,
        'Diameter': `${diameter} inches`,
        'Address': `${civic_number} ${on_street}`,
        'Date Planted': date_planted ? `${toPrettyDateString(date_planted)}` : 'Unknown' 
    }

    var treeDetails = [];
    for (const [key, value] of Object.entries(listValues)) {
        treeDetails.push(
            <TreeListElement key={key}>
                <TreeDetail>
                    <TreeDetailKey>{key}</TreeDetailKey> 
                    <TreeDetailValue>{value}</TreeDetailValue>
                    { (key === 'Address') && <CopyButton onClick={() => {
                        navigator.clipboard.writeText(value); // only for modern browsers
                    }}>{Copy}</CopyButton>}
                </TreeDetail>
            </TreeListElement>
        )
    }

    const citywidePrevalence = (stats) => {
        console.log(`In city: ${stats.tree_stats[common_name].total_count}`);
        console.log(`Num trees in city: ${stats.city_tree_count}`)
         let percentage = Math.round(((stats.tree_stats[common_name].total_count / stats.city_tree_count) * 100)).toFixed(2)
         return formatPrevalanceResult(parseInt(percentage));
    };
    const neighborhoodPrevalance = (stats) => {
        console.log(`In Neighborhood: ${stats.tree_stats[common_name].neighborhood_counts[neighbourhood_name]}`);
        console.log(`Total in Neighborhood: ${stats.neigh_num_trees[neighbourhood_name]}`);
        let percentage = Math.round(((stats.tree_stats[common_name].neighborhood_counts[neighbourhood_name] / stats.neigh_num_trees[neighbourhood_name]) * 100)).toFixed(2);
        return formatPrevalanceResult(parseInt(percentage));
    };

    const formatPrevalanceResult = (percentage) => {
        let result;
        if (percentage < 0.5) {
            result = 'Less than 0.5';
        } else {
            result = percentage >= 1 ? `About ${Math.round(percentage).toFixed(0)}` : percentage.toFixed(2);
        }
        return result;
    }
    
    const getBlurb = (blurbs) => {
        let key = formatSciName().toLowerCase().split(' ').join('_')
        return key in blurbs ? blurbs[key] : null;
    }

    const formatSciName = () => {
        let tmp_species_name = species_name;
        let species_name_arr = species_name.trim().split(' ');
        if (species_name_arr[species_name_arr.length - 1].toLowerCase() === 'x') {
            tmp_species_name = `${species_name_arr[species_name_arr.length - 1]} ${species_name_arr[0]}`;
        }
        return titleCase(`${genus_name} ${tmp_species_name}`);
    }

    let cult = cultivar_name ? ` (${titleCase(cultivar_name)})` : '';
    let neighPrevalance = React.useMemo(() => neighborhoodPrevalance(props.stats), [tree_id]);
    let totalPrevalance = React.useMemo(() => citywidePrevalence(props.stats), [tree_id]);
    let blurb = React.useMemo(() => getBlurb(props.blurbs), [tree_id]);

    return (
        <StyledTreeInfo>
            <StyledSubText font_size='1.5rem' font_style='italic' text_transform='capitalize'>
                {`${formatSciName()} ` + cult}
            </StyledSubText>
            <StyledSubText font_size='0.9rem' font_style='none'>
            {`${neighPrevalance}% of ${titleCase(neighbourhood_name)} trees.`}
                {/* {`${neighborhoodPrevalance(props.stats)}% of ${titleCase(neighbourhood_name)} trees.`} */}
            </StyledSubText>
            <StyledSubText font_size='0.9rem' font_style='none'>
                {`${totalPrevalance}% of Vancouver trees.`}
            </StyledSubText>
            <TreeDetailsList>
                {treeDetails}
            </TreeDetailsList>
            {props.children}
            {blurb && <p style={{'fontSize': '1.1rem', 'lineHeight': '1.6'}}>{blurb}</p>}
        </StyledTreeInfo>    
    ); 
}

export default React.memo(TreeInfoContainer); // look into if memoizing this results in worse performance (or does anything)