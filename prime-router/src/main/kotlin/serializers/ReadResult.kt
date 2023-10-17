package gov.cdc.prime.router.serializers

import gov.cdc.prime.router.ActionLogger
import gov.cdc.prime.router.Report

/**
 * Used by converter/formatters to return results
 */
data class ReadResult(
    /**
     * The report generated by the read may be empty because of read validation errors
     */
    val report: Report,
    /**
     * The list of errors that caused a item to not be reported
     */
    val actionLogs: ActionLogger,
) {
    init {
        actionLogs.setReportId(report.id)
    }
}