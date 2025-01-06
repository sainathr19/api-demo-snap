import {
  Box,
  Button,
  Container,
  Field,
  Footer,
  Form,
  Icon,
  Input,
  Row,
  Section,
  Text,
  Value,
} from '@metamask/snaps-sdk/jsx';
import { Quote, SwapFormErrors } from '../lib/types';
import { baseToDecimal, calculateFee, getBestQuote } from '../lib/utils';
import Header from './Header';

type Props = {
  inAmount?: string;
  quote?: Quote;
  errors?: SwapFormErrors;
  isLoading?: boolean;
  btcAddress: string;
  btcBalance : number
};

const HomePage = ({
  inAmount,
  quote,
  errors,
  isLoading,
  btcAddress,
  btcBalance
}: Props) => {
  let hasQuote = inAmount ? (quote ? true : false) : false;
  let outAmount, fee;
  if (hasQuote) {
    outAmount = baseToDecimal(getBestQuote(quote!), 8);
    fee = calculateFee(quote!, inAmount!);
  }
  const hasCreateError = errors?.createError ? true : false;
  const showLoading = isLoading ? true : false;

  return (
    <Container>
      <Box>
        <Header btcAddress={btcAddress} btcBalance={btcBalance}/>
        <Form name="swap_form">
          <Field label="Send" error={errors?.inAmount}>
            <Input
              name="in_amount"
              type="number"
              placeholder="0.0"
              value={inAmount}
            />
            <Box direction="horizontal" center>
              <Text color="alternative">{'BTC'}</Text>
            </Box>
          </Field>
          <Section>
            <Row label="Receive">
              <Text>{outAmount ? `${outAmount} WBTC` : '--'}</Text>
            </Row>
          </Section>
        </Form>
        <Section>
          <Row label="Estimated fee">
            <Text>{fee ? `${fee.toFixed(2)}` : '--'}</Text>
          </Row>
          <Row label="ETA" tooltip="The estimated time of the TX">
            <Text>{fee ? '~10m' : '--'}</Text>
          </Row>
        </Section>
        {hasCreateError && (
          <Box direction="horizontal" alignment="center">
            <Icon name="warning" size="md" />
            <Text>{errors?.createError!}</Text>
          </Box>
        )}
      </Box>
      <Footer>
        <Button name="initiate_swap" disabled={showLoading}>
          Swap
        </Button>
      </Footer>
    </Container>
  );
};

export default HomePage;
