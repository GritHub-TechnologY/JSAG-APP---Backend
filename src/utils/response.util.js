/**
 * API response utility functions
 */
class ResponseUtil {
  /**
   * Send success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  /**
   * Send error response
   */
  static error(res, message = 'Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors
    });
  }

  /**
   * Send validation error response
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation Error', 400, errors);
  }

  /**
   * Send unauthorized error response
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden error response
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  /**
   * Send not found error response
   */
  static notFound(res, message = 'Not Found') {
    return this.error(res, message, 404);
  }

  /**
   * Send conflict error response
   */
  static conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  }

  /**
   * Send too many requests error response
   */
  static tooManyRequests(res, message = 'Too Many Requests') {
    return this.error(res, message, 429);
  }

  /**
   * Send paginated response
   */
  static paginated(res, data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return this.success(res, {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  }

  /**
   * Send created response
   */
  static created(res, data = null, message = 'Resource Created') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send accepted response
   */
  static accepted(res, data = null, message = 'Request Accepted') {
    return this.success(res, data, message, 202);
  }

  /**
   * Send no content response
   */
  static noContent(res) {
    return res.status(204).end();
  }

  /**
   * Send bad request response
   */
  static badRequest(res, message = 'Bad Request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Send server error response
   */
  static serverError(res, error) {
    const isProd = process.env.NODE_ENV === 'production';
    return this.error(
      res,
      isProd ? 'Internal Server Error' : error.message,
      500,
      isProd ? null : {
        stack: error.stack,
        ...error
      }
    );
  }

  /**
   * Send bulk operation response
   */
  static bulkResponse(res, results) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    return this.success(res, {
      summary,
      results
    });
  }

  /**
   * Send analytics response
   */
  static analyticsResponse(res, data, metadata = {}) {
    return this.success(res, {
      metadata,
      data
    });
  }

  /**
   * Send export response
   */
  static exportResponse(res, data, format = 'csv') {
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=export-${timestamp}.${format}`);
    return res.send(data);
  }

  /**
   * Send streaming response
   */
  static streamResponse(res, stream) {
    stream.on('error', (error) => {
      this.serverError(res, error);
    });
    return stream.pipe(res);
  }
}

export default ResponseUtil; 