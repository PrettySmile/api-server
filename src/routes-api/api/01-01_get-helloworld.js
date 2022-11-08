const express = require('express');

module.exports = function (app, common_middleware = []) {
    const router = express.Router();
    app.use(router);

    /**
     * GET API
     */
    router.get(['/test/get-helloworld'], [...common_middleware], async (req, res, next) => {
        try {
            const { name } = req.query;
            return res.json({ code: 0, data: name });
        } catch (err) {
            console.error(err);
            return res.status(500).json(
                { code: 500, message: `something wrong` }
            );
        }
    });
}
