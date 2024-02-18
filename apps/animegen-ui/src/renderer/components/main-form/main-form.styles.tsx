import { styled } from '@mui/material/styles';

export const MainForm = styled('form')`
  height: 100%;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    width: 4px;
    overflow-y: scroll;
    background: grey;
    box-shadow: inset 0 0 4px #707070;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.palette.primary.main};
    border-radius: 10px;
  }
`;
