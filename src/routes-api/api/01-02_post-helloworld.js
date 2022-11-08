const express = require('express');

module.exports = function (app, common_middleware = []) {
    const router = express.Router();
    app.use(router);

    /**
     * POST API
     */
    router.post(['/test/post-helloworld'], [...common_middleware], async (req, res, next) => {
        try {
            const { name } = req.body;
            return res.json({ code: 0, data: name });
        } catch (err) {
            console.error(err);
            return res.status(500).json(
                { code: 500, message: `something wrong` }
            );
        }
    });
}
