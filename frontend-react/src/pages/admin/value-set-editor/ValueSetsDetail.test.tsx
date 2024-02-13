import { act, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { AxiosError, AxiosResponse } from "axios";

import { ValueSetsDetailPage, ValueSetsDetailTable } from "./ValueSetsDetail";
import {
    useValueSetActivation,
    useValueSetsMeta,
    UseValueSetsMetaResult,
    useValueSetsTable,
    UseValueSetsTableResult,
    useValueSetUpdate,
} from "../../../hooks/UseValueSets";
import { renderApp } from "../../../utils/CustomRenderUtils";
import { RSNetworkError } from "../../../utils/RSNetworkError";

const fakeRows = [
    {
        name: "a-path",
        display: "hi over here first value",
        code: "1",
        version: "1",
    },
    {
        name: "a-path",
        display: "test, yes, second value",
        code: "2",
        version: "1",
    },
];

const fakeMeta = {
    lookupTableVersionId: 1,
    tableName: "fake_table",
    tableVersion: 2,
    isActive: true,
    createdBy: "me",
    createdAt: "today",
    tableSha256Checksum: "sha",
};
const mockError = new RSNetworkError(new AxiosError("test-error"));

jest.mock<typeof import("../../../hooks/UseValueSets")>(
    "../../../hooks/UseValueSets",
    () => ({
        ...jest.requireActual("../../../hooks/UseValueSets"),
        useValueSetsTable: jest.fn(),
        useValueSetUpdate: jest.fn(),
        useValueSetActivation: jest.fn(),
        useValueSetsMeta: jest.fn(),
    }),
);

const mockSaveData = jest.mocked(useValueSetUpdate);
const mockActivateTable = jest.mocked(useValueSetActivation);
const mockUseValueSetsTable = jest.mocked(useValueSetsTable);
const mockUseValueSetsMeta = jest.mocked(useValueSetsMeta);

jest.mock<typeof import("react-router-dom")>("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({ valueSetName: "a-path" }) as any,
}));

describe("ValueSetsDetail", () => {
    test("Renders with no errors", () => {
        mockUseValueSetsTable.mockImplementation(
            () =>
                ({
                    data: fakeRows,
                }) as UseValueSetsTableResult,
        );
        mockUseValueSetsMeta.mockImplementation(
            () =>
                ({
                    data: fakeMeta,
                }) as any,
        );
        mockSaveData.mockImplementation(() => ({}) as any);
        mockActivateTable.mockImplementation(() => ({}) as any);
        // only render with query provider
        renderApp(<ValueSetsDetailPage />);
        const headers = screen.getAllByRole("columnheader");
        const title = screen.getByText("ReportStream Core Values");
        const datasetActionButton = screen.getByText("Add item");
        const rows = screen.getAllByRole("row");

        expect(headers.length).toEqual(4);
        expect(title).toBeInTheDocument();
        expect(datasetActionButton).toBeInTheDocument();
        expect(rows.length).toBe(3); // +1 for header
    });

    test("Rows are editable", async () => {
        mockUseValueSetsTable.mockImplementation(
            () =>
                ({
                    data: fakeRows,
                }) as UseValueSetsTableResult,
        );
        mockUseValueSetsMeta.mockImplementation(
            () =>
                ({
                    data: fakeMeta,
                }) as UseValueSetsMetaResult,
        );
        mockSaveData.mockImplementation(() => ({}) as any);
        mockActivateTable.mockImplementation(() => ({}) as any);
        renderApp(<ValueSetsDetailPage />);
        const editButtons = screen.getAllByText("Edit");
        const rows = screen.getAllByRole("row");

        // assert they are present on all rows but header
        expect(editButtons.length).toEqual(rows.length - 1);

        await waitFor(async () => {
            // activate editing mode for first row
            await userEvent.click(editButtons[0]);
            await screen.findByText("Save");
        });

        // assert input element is rendered in edit mode
        const input = screen.getAllByRole("textbox");
        expect(input.length).toEqual(3);
    });

    test("Handles error with table fetch", () => {
        mockUseValueSetsTable.mockImplementation(() => {
            throw new RSNetworkError(
                new AxiosError("Test", "404", undefined, {}, {
                    status: 404,
                } as AxiosResponse),
            );
        });
        mockUseValueSetsMeta.mockImplementation(
            () =>
                ({
                    data: fakeMeta,
                }) as UseValueSetsMetaResult,
        );
        /* Outputs a large error stack...should we consider hiding error stacks in page tests since we
         * test them via the ErrorBoundary test? */
        renderApp(<ValueSetsDetailPage />);
        expect(
            screen.getByText(
                "Our apologies, there was an error loading this content.",
            ),
        ).toBeInTheDocument();
    });
});

describe("ValueSetsDetailTable", () => {
    test("Handles fetch related errors", () => {
        const mockSetAlert = jest.fn();
        mockSaveData.mockImplementation(() => ({}) as any);
        mockActivateTable.mockImplementation(() => ({}) as any);
        renderApp(
            <ValueSetsDetailTable
                valueSetName={"error"}
                setAlert={mockSetAlert}
                valueSetData={[]}
                error={mockError}
            />,
        );
        expect(mockSetAlert).toHaveBeenCalled();
        expect(mockSetAlert).toHaveBeenCalledWith({
            type: "error",
            message: "unknown-error: test-error",
        });
    });
    test("on row save, calls saveData and activateTable triggers with correct args", async () => {
        const mockSaveDataMutate = jest.fn();
        const mockActivateTableMutate = jest.fn();
        mockSaveData.mockImplementation(
            () =>
                ({
                    mutateAsync: mockSaveDataMutate.mockImplementation(() =>
                        Promise.resolve({ tableVersion: 2 }),
                    ),
                }) as any,
        );

        mockActivateTable.mockImplementation(
            () =>
                ({
                    mutateAsync: mockActivateTableMutate.mockImplementation(
                        () => Promise.resolve({ tableVersion: 2 }),
                    ),
                }) as any,
        );
        const mockSetAlert = jest.fn();
        const fakeRowsCopy = [...fakeRows];

        renderApp(
            <ValueSetsDetailTable
                valueSetName={"a-path"}
                setAlert={mockSetAlert}
                valueSetData={fakeRows}
            />,
        );
        const editButtons = screen.getAllByText("Edit");
        const editButton = editButtons[0];
        expect(editButton).toBeInTheDocument();
        await waitFor(async () => {
            await userEvent.click(editButton);
            await screen.findByText("Save");
        });
        const saveButton = await screen.findByText("Save");

        const inputs = screen.getAllByRole<HTMLInputElement>("textbox");
        expect(inputs.length).toBe(3);
        const firstInput = inputs[0];
        const initialValue = firstInput.value;
        const newValue = "~~fakeInputValue~~";
        await waitFor(async () => {
            await userEvent.click(firstInput);
            await userEvent.type(firstInput, newValue);
            expect(firstInput).toHaveValue(initialValue + newValue);
        });

        // eslint-disable-next-line testing-library/no-unnecessary-act
        await act(async () => {
            await userEvent.click(saveButton);
        });
        fakeRowsCopy.shift();

        expect(mockSaveDataMutate).toHaveBeenCalled();
        expect(mockSaveDataMutate).toHaveBeenCalledWith({
            data: [
                {
                    ...fakeRows[0],
                    display: `${initialValue}~~fakeInputValue~~`,
                },
                ...fakeRowsCopy,
            ],
            tableName: "a-path",
        });
        expect(mockActivateTableMutate).toHaveBeenCalled();
        expect(mockActivateTableMutate).toHaveBeenCalledWith({
            tableVersion: 2,
            tableName: "a-path",
        });
    });
});

// TODO: tests for header
