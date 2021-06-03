import * as React from 'react';
import { useState, useEffect } from 'react';
import { heightStringFromID, titleCase, toPrettyDateString, sentenceCase} from '../utils';
import styled from 'styled-components';
import { Copy, Check } from '../svg-icons';
// import { Check } from '../../public/check.svg';
import "regenerator-runtime/runtime.js";

// margin order is top right bottom left
const StyledTreeInfo = styled.section`
    position: relative;
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
    margin-bottom: ${props => (props.margin_bottom ? props.margin_bottom : 0)};
    font-size: ${props => (props.font_size)};
    font-style: ${props => (props.font_style)};
    font-weight: 50;
`;

const TreeDetailsList = styled.ul`
    list-style-type: none
`;

const TreeListElement = styled.li`
    border-bottom: 1px solid lightgrey;
    width: 95%;
    margin-bottom: 0.5rem;
`;

const TreeDetail = styled.div`
    display: flex;
    vertical-align: middle;
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
    opacity: ${(props) => (props.copied ? 1 : 0.3)};
    vertical-align: middle;

    &:hover {
        opacity: 1;
    }
`;

const Blurb = styled.p`
    font-size: 1.1rem;
    line-height: 1.5;
    text-align: justify;
    margin-top: 0px;
    margin-bottom: 60px;
`;



/**
 * This container should reviece the properties of the selected tree
 * and the treeStats object which is calculated on first render.
 *
 * @param {any} props
 * @returns
 */
const TreeInfoContainer = (props) => {
    const [copied, setCopied] = useState(false);

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

    async function onClick() {
        setCopied(true);
        navigator.clipboard.writeText(listValues.Address); // only for modern browsers
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCopied(false);
    }

    var treeDetails = [];
    for (const [key, value] of Object.entries(listValues)) {
        treeDetails.push(
            <TreeListElement key={key}>
                <TreeDetail>
                    <TreeDetailKey>{key}</TreeDetailKey>
                    <TreeDetailValue>{value}</TreeDetailValue>
                    { (key === 'Address') &&
                    <CopyButton copied={copied} onClick={onClick}>{copied ? Check : Copy}</CopyButton>}
                </TreeDetail>
            </TreeListElement>
        )
    }

    const citywidePrevalence = (stats) => {
         let percentage = Math.round(((stats.tree_stats[common_name].total_count / stats.city_tree_count) * 100)).toFixed(2)
         return formatPrevalanceResult(parseInt(percentage));
    };
    const neighborhoodPrevalance = (stats) => {
        let percentage = Math.round(((stats.tree_stats[common_name].neighborhood_counts[neighbourhood_name] / stats.neighborhood_stats[neighbourhood_name].total_count) * 100)).toFixed(2);
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
        let key = formatSciName().toLowerCase().split(' ').join('_');
        let blurb = (key in blurbs) ? [] : null;
        if (blurb) {
            for (let i = 0; i < blurbs[key].length; i++) {
                blurb.push(
                    <Blurb key={i}>
                        {blurbs[key][i]}
                    </Blurb>
                );
            }
        }
        return blurb;
    }

    const formatSciName = () => {
        let tmp_species_name = species_name;
        let species_name_arr = species_name.trim().split(' ');
        if (species_name_arr[species_name_arr.length - 1].toLowerCase() === 'x') {
            tmp_species_name = `${species_name_arr[species_name_arr.length - 1]} ${species_name_arr[0]}`;
        }
        return sentenceCase(`${genus_name} ${tmp_species_name}`);
    }

    let cult = cultivar_name ? ` (${titleCase(cultivar_name)})` : '';
    let neighPrevalance = React.useMemo(() => neighborhoodPrevalance(props.stats), [tree_id]);
    let totalPrevalance = React.useMemo(() => citywidePrevalence(props.stats), [tree_id]);
    let blurb = React.useMemo(() => getBlurb(props.blurbs), [tree_id]);

    return (
        <StyledTreeInfo>
            <StyledSubText font_size='1.5rem' font_style='italic'>
                {`${formatSciName()} ` + cult}
            </StyledSubText>
            <StyledSubText font_size='0.9rem' font_style='none'>
            {`${neighPrevalance}% of ${titleCase(neighbourhood_name)} trees.`}
            </StyledSubText>
            <StyledSubText font_size='0.9rem' font_style='none'>
                {`${totalPrevalance}% of Vancouver trees.`}
            </StyledSubText>
            <TreeDetailsList>
                {treeDetails}
            </TreeDetailsList>
            {props.children}
            {blurb}
        </StyledTreeInfo>
    );
}

export default React.memo(TreeInfoContainer); // look into if memoizing this results in worse performance (or does anything)