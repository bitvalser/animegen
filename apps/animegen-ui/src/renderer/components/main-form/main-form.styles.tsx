import styled from '@emotion/styled';

export const MainForm = styled.form`
  height: 100%;
  padding-bottom: 10px;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    width: 4px;
    overflow-y: scroll;
    background: grey;
    box-shadow: inset 0 0 4px #707070;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }: any) => theme.palette.primary.main};
    border-radius: 10px;
  }
`;
