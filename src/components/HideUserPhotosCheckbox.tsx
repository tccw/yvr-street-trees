import { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import HideImageOutlinedIcon from '@mui/icons-material/HideImageOutlined';
import ImageIcon from '@mui/icons-material/Image';
import { orange } from '@mui/material/colors';

const checkboxLabel = { inputProps: { 'aria-label': 'Display image toggle' } };

interface HideUserPhotosCheckboxProps {
    onClick: () => void
}

export default function HideUserPhotosCheckbox(props: {onChange: () => void}) {
    const [boxText, setBoxText] = useState<string>("Toggle Photos")

  return (
    <div>
        <FormControlLabel control={
            <Checkbox
            {...checkboxLabel}
            sx={{
                '&.Mui-checked': {
                  color: orange[500],
                },
                '& .MuiSvgIcon-root': { fontSize: 40 }
              }}
            defaultChecked
            size="medium"
            icon={<HideImageOutlinedIcon />}
            checkedIcon={<ImageIcon />}
            onClick={props.onChange}
        />
          } label={boxText} />
    </div>
  );
}