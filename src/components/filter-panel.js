import * as React from 'react';
import styled from 'styled-components';


const StyledFilterPanel = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    padding: 12px 24px;
    margin: 20px;
    line-height: 2;
    outline: none;
    display:flex;
    flex-direction: column;
`;

export function FilterPanel(props) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    }

    var checkboxes = ['Under 6 inches', '6 to 12 inches', 
                      '12 to 18 inches', '18 to 24 inches',
                      '24 to 36 inches', 'Over 36 inches'].map((text) => {
                          return (
                              <label>
                                  <input type='checkbox' checked/>
                                  {text}
                              </label>
                          )
                      })

    return (
        <StyledFilterPanel>
            {checkboxes}
        </StyledFilterPanel>
    )
}