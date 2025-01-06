import {
  Box,
  Button,
  Container,
  Footer,
  Heading,
  SnapComponent,
  Text,
} from '@metamask/snaps-sdk/jsx';

type Props = {};

const SendConfirmation : SnapComponent = (props: Props) => {
  return (
    <Container>
      <Box>
        <Heading>Custom Dialog</Heading>
        <Text>
          This is a custom dialog reproducing a confirmation dialog.
          <br />
          Do you accept?
        </Text>
      </Box>
      <Footer>
        <Button name="confirm">No</Button>
        <Button name="cancel">Yes</Button>
      </Footer>
    </Container>
  );
};

export default SendConfirmation;
