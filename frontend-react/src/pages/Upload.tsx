import React, {useState} from "react";
import {
    Button,
    Form,
    FormGroup,
    Label,
    FileInput
}
    from '@trussworks/react-uswds';
import {useResource} from 'rest-hooks';
import AuthResource from "../resources/AuthResource";
import {useOktaAuth} from "@okta/okta-react";
import {senderClient} from "../webreceiver-utils";
import moment from "moment";
import {library} from '@fortawesome/fontawesome-svg-core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSync} from '@fortawesome/free-solid-svg-icons';
import SenderOrganizationResource from "../resources/SenderOrganizationResource";

library.add(faSync);

export const Upload = () => {
    const {authState} = useOktaAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [errors, setErrors] = useState([]);
    const [destinations, setDestinations] = useState('');
    const [reportId, setReportId] = useState(null);
    const [successTimestamp, setSuccessTimestamp] = useState('');
    const [buttonText, setButtonText] = useState('Upload');
    const [headerMessage, setHeaderMessage] = useState('Upload your COVID-19 results');
    const [errorMessageText, setErrorMessageText] = useState(
        `Please resolve the errors below and upload your edited file. Your file has not been accepted.`
    );

    const client = senderClient(authState);
    const organization = useResource(SenderOrganizationResource.detail(), {
        name: client
    });

    const userName = {
        firstName: authState!.accessToken?.claims.given_name,
        lastName: authState!.accessToken?.claims.family_name
    }

    const uploadReport =
        async function postData(file) {
            let textBody;
            let response;
            try {
                response = await fetch(`${AuthResource.getBaseUrl()}/api/waters`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/csv',
                        'client': client,
                        'authentication-type': 'okta',
                        'Authorization': `Bearer ${authState?.accessToken?.accessToken}`
                    },
                    body: file
                });

                textBody = await response.text();

                // if this JSON.parse fails, the body was most likely an error string from the server
                return JSON.parse(textBody);
            } catch (error) {

                return {
                    ok: false,
                    status: response ? response.status : 500,
                    errors: [{
                        details: textBody ? textBody : error
                    }]
                };
            }
        }

    const handleChange = (event) => {
        setFile(event.target.files[0]);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        // reset the state on subsequent uploads
        setIsSubmitting(true);
        setReportId(null);
        setSuccessTimestamp('');
        setWarnings([]);
        setErrors([]);
        setDestinations('');

        if (file) {
            let response;
            try {

                response = await uploadReport(file);

                if (response.destinations && response.destinations.length) {
                    setDestinations(response.destinations.map(d => d['organization']).join(', '));
                }

                if (response.id) {
                    setReportId(response.id);
                    setSuccessTimestamp(response.timestamp);
                    event.target.reset();
                }

                if (response.warnings && response.warnings.length) {
                    setWarnings(response.warnings);
                }

                if (response.errors && response.errors.length) {
                    setErrors(response.errors);

                    // if there is a response status, then there was most likely a server-side error as the json was not parsed
                    if (response.status) {
                        setErrorMessageText('There was a server error. Your file has not been accepted.');
                    } else {
                        setErrorMessageText('Please resolve the errors below and upload your edited file. Your file has not been accepted.');
                    }
                }

                setHeaderMessage('Your COVID-19 Results');
                setButtonText('Upload another file');

            } catch (error) {
                if (response && response.errors) {
                    setErrors(response.errors);
                } else {
                    setErrors(error);
                }
                setButtonText('Upload another file');
            }
            setIsSubmitting(false);
        }
    }

    const formattedSuccessDate = (format) => {
        const timestampDate = new Date(successTimestamp);
        return moment(timestampDate).format(format);
    }

    const timeZoneAbbreviated = () => {
        const x: RegExpMatchArray | null = new Date().toString().match(/\((.+)\)/);

        // In Chrome browser, new Date().toString() is
        // "Thu Aug 06 2020 16:21:38 GMT+0530 (India Standard Time)"

        // In Safari browser, new Date().toString() is
        // "Thu Aug 06 2020 16:24:03 GMT+0530 (IST)"
        if (x) {
            if (x["1"].includes(" ")) {
                return x["1"]
                    .split(" ")
                    .map(([first]) => first)
                    .join("");
            } else {
                return x["1"];
            }
        }
        return 'unknown timezone';
    };

    return (
        <div className="grid-container usa-section margin-bottom-10">
                <span id="orgName" className="text-normal text-base margin-bottom-0">
                    {userName.firstName} {userName.lastName}
                </span>
            <h1 className="margin-top-0 margin-bottom-5">{organization?.description}</h1>
            <h2 className="font-sans-lg">{headerMessage}</h2>
            {reportId && (
                <div>
                    <div className="usa-alert usa-alert--success">
                        <div className="usa-alert__body">
                            <h4 className="usa-alert__heading">Success: File accepted</h4>
                            <p className="usa-alert__text">
                                Your file has been successfully transmitted to the department of health.
                            </p>
                        </div>
                    </div>
                    <div>
                        <p id="orgName" className="text-normal text-base margin-bottom-0">
                            Confirmation Code
                        </p>
                        <p className="margin-top-05">{reportId}</p>
                    </div>
                    <div>
                        <p id="orgName" className="text-normal text-base margin-bottom-0">
                            Date Received
                        </p>
                        <p className="margin-top-05">{formattedSuccessDate('DD MMMM YYYY')}</p>
                    </div>

                    <div>
                        <p id="orgName" className="text-normal text-base margin-bottom-0">
                            Time Received
                        </p>
                        <p className="margin-top-05">{`${formattedSuccessDate('h:mm')} ${timeZoneAbbreviated()}`}</p>
                    </div>
                    <div>
                        <p id="orgName" className="text-normal text-base margin-bottom-0">
                            Recipients
                        </p>
                        {destinations && (
                            <p className="margin-top-05">
                                {destinations}
                            </p>
                        )}
                        {(!destinations) && (
                            <p className="margin-top-05">There are no known recipients at this time.</p>
                        )}
                    </div>
                </div>
            )}

            {warnings.length > 0 && (
                <div>
                    <div className="usa-alert usa-alert--warning">
                        <div className="usa-alert__body">
                            <h4 className="usa-alert__heading">Alert: Unusable Fields Detected</h4>
                            <p className="usa-alert__text">
                                Your file has been accepted with warnings.
                                There were fields detected that are unusable for public health action.
                                Enter valid information for future submissions.
                            </p>
                        </div>
                    </div>
                    <ul>
                        {warnings.map((w, i) => {
                            return (<li key={i}>
                                {w['id'] && (<span>{w['id']}: </span>)}{w['details']}
                            </li>);
                        })}
                    </ul>
                </div>
            )}

            {errors.length > 0 && (
                <div>
                    <div className="usa-alert usa-alert--error" role="alert">
                        <div className="usa-alert__body">
                            <h4 className="usa-alert__heading">Error: File not accepted</h4>
                            <p className="usa-alert__text">
                                {errorMessageText}
                            </p>
                        </div>
                    </div>
                    <ul>
                        {errors.map((e, i) => {
                            return (<li key={i}>{e['details']}</li>);
                        })}
                    </ul>
                </div>
            )}

            <Form onSubmit={(e) => handleSubmit(e)}>
                <FormGroup className="margin-bottom-3">
                    <Label className="font-sans-xs" id="upload-csv-input-label" htmlFor="upload-csv-input">
                        Upload your COVID-19 lab results as a .CSV.
                    </Label>
                    <FileInput
                        id="upload-csv-input"
                        name="upload-csv-input"
                        aria-describedby="upload-csv-input-label"
                        accept=".csv, text/csv"
                        onChange={(e) => handleChange(e)}
                        required
                    />
                </FormGroup>
                <Button type="submit" disabled={isSubmitting}>
                    {
                        isSubmitting && (
                            <span>
                                <FontAwesomeIcon icon="sync" spin className="margin-right-05"/>
                                <span>Processing file...</span>
                            </span>
                        )
                    }

                    {!isSubmitting && <span>{buttonText}</span>}
                </Button>
            </Form>
        </div>
    );
}
