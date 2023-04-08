import { MobileMapStyleToggle } from "../MapStyleToggleMobile";
import { StyledFilterPanel } from "./styles";


const MapStyleToggle = (props: { setStyle: any; styles: any }) => {
  const { setStyle, styles } = props;

  const mobileStylePanel = {
    bottom: "62px",
    right: "0",
    padding: "4px",
    marginRight: "50px",
  };

  return (
    <StyledFilterPanel style={ mobileStylePanel }>
        <MobileMapStyleToggle styles={styles} setStyle={setStyle}/>
    </StyledFilterPanel>
  );
};

export default MapStyleToggle;
