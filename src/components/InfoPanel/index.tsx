import React, { forwardRef, MouseEventHandler, Ref } from "react";
import {
  Panel,
  Title,
  Dot,
  PanelHeader,
  OpenCloseButton,
  OpenFlagContainer,
} from "./styles";
import { ChevronRight, ChevronLeft } from "../../svg-icons";
import Logo from "../../assets/road.png";

interface InfoPanelProps {
  color: string;
  title: string;
  handleToggle: MouseEventHandler<HTMLButtonElement> & ((e: Event) => void);
  isExpanded: boolean;
  className: string;
  children: React.ReactNode;
}

// export type Ref = HTMLDivElement;

const InfoPanel = forwardRef<Ref<HTMLDivElement>, InfoPanelProps>(
  (props, ref) => {
    const { color, title, handleToggle, isExpanded, className } = props;

    return (
      <>
        {/* @ts-ignore */}
        <Panel open={isExpanded} ref={ref} className={className}>
          <PanelHeader>
            <OpenCloseButton onClick={handleToggle} title="collapse panel">
              {ChevronLeft}
            </OpenCloseButton>
            <img src={Logo} style={{
                'maxHeight': '40px',
                'marginRight': '1rem'
            }} />
          </PanelHeader>
          <Title>

            {title}
            {color && <Dot color={color}></Dot>}
          </Title>
          {props.children}
        </Panel>
        {!isExpanded && (
          <OpenFlagContainer>
            <OpenCloseButton onClick={handleToggle} title="expand panel">
              {ChevronRight}
            </OpenCloseButton>
          </OpenFlagContainer>
        )}
      </>
    );
  }
);

export default InfoPanel;
