import React, { forwardRef, MouseEventHandler, Ref, useState } from "react";
import {
  Panel,
  Title,
  Dot,
  PanelHeader,
  OpenCloseButton,
  OpenFlagContainer,
  FeedbackButton,
  PanelFooter,
  FooterLink,
} from "./styles";
import { ChevronRight, ChevronLeft, MessageSquare } from "../../svg-icons";
// import Logo from "../../assets/road.png";
import Logo from "../../assets/Spring 100x100.png";
import FeedbackModal from "../FeedbackModal";
import { ACTIVE_CITY } from "../../config/city-config";

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
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const handleOpenFeedback = () => {
      setIsFeedbackOpen(true);
    };

    const handleCloseFeedback = () => {
      setIsFeedbackOpen(false);
    };

    return (
      <>
        {/* @ts-ignore */}
        <Panel open={isExpanded} ref={ref} className={className}>
          <PanelHeader>
            <OpenCloseButton onClick={handleToggle} title="collapse panel">
              {ChevronLeft}
            </OpenCloseButton>
            <img src={Logo} style={{
                'maxHeight': '2.5rem',
                'marginRight': '0.2rem',
                'padding': '0.1rem'
            }} />
          </PanelHeader>
          <Title>
            {title}
            {color && <Dot color={color}></Dot>}
          </Title>
          {props.children}
          <FeedbackButton onClick={handleOpenFeedback} title="Provide feedback">
            {MessageSquare}
            <span>Feedback</span>
          </FeedbackButton>
          <PanelFooter>
            <FooterLink
              href="https://github.com/tccw/yvr-street-trees/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Changelog
            </FooterLink>
            {ACTIVE_CITY.siblingMaps.map((site) => (
              <React.Fragment key={site.url}>
                <span aria-hidden="true">·</span>
                <FooterLink
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {site.label}
                </FooterLink>
              </React.Fragment>
            ))}
            <span aria-hidden="true">·</span>
            <span>{ACTIVE_CITY.footerDataText}</span>
          </PanelFooter>
        </Panel>
        {!isExpanded && (
          <OpenFlagContainer>
            <OpenCloseButton onClick={handleToggle} title="expand panel">
              {ChevronRight}
            </OpenCloseButton>
          </OpenFlagContainer>
        )}
        <FeedbackModal isOpen={isFeedbackOpen} onClose={handleCloseFeedback} />
      </>
    );
  }
);

export default InfoPanel;
