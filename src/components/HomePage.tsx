import { Box, Button, Container, Field, Footer, Form, Icon, Image, Input, Row, Section, Text } from '@metamask/snaps-sdk/jsx'
import { Quote, SwapFormErrors } from '../lib/types'
import { baseToDecimal, calculateFee, getBestQuote } from '../lib/utils'
import btcIcon from "../assets/btc.svg";

type Props = {
    refundAddress? : string,
    inAmount? : string,
    quote? : Quote,
    errors? : SwapFormErrors
}

const HomePage = ({refundAddress, inAmount, quote, errors }: Props) => {

    let hasQuote = inAmount ? quote ? true : false : false;
    let outAmount,fee;
    if (hasQuote){
        outAmount = baseToDecimal(getBestQuote(quote!),8);
        fee = calculateFee(quote!,inAmount!);
    }

    const hasCreateError = errors?.createError ? true : false;

    return (
    <Container>
        <Box>
            <Form name="swap_form">
                <Field label="Send" error={errors?.inAmount}>
                    <Input name="in_amount" type="number" placeholder="0.0"   value={inAmount}/>
                    <Box direction="horizontal" center>
                        <Text color="alternative">{"BTC"}</Text>
                    </Box>
                </Field>
                <Section>
                    <Row label="Receive">
                        <Text>
                            {outAmount ? `${outAmount} WBTC` : "--"} 
                        </Text>
                    </Row>
                </Section>
                <Field label="Recovery Address" error={errors?.refundAddress}>
                    <Box>
                        <Image src={btcIcon}  />
                    </Box>
                    <Input
                        name="refund_address"
                        placeholder="Your Bitcoin Address"
                        value={refundAddress ? refundAddress : undefined}
                    />
                </Field>
            </Form> 
            <Section>
                <Row label="Estimated fee">
                    <Text>{fee ? fee.toFixed(2) : "--"}</Text>
                </Row>
                <Row label="ETA" tooltip="The estimated time of the TX">
                    <Text>{fee ? "~10m" : "--"}</Text>
                </Row>
            </Section>
            {
                hasCreateError &&
                <Box direction="horizontal">
                    <Icon name="warning" size="md" />
                    <Text>{errors?.createError!}</Text>
                </Box> 
            }
        </Box> 
        <Footer>
            <Button name="initiate_swap">Swap</Button>
        </Footer>
    </Container>       
    )
}

export default HomePage